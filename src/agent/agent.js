const { END, START } = require("@langchain/langgraph");
const { StateGraph } = require("@langchain/langgraph");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { LLMFactory } = require("./llmFactory");
const { PLANNING_SYSTEM_PROMPT, CRITIQUE_SYSTEM_PROMPT } = require("./agentUtils.js");
const { doubleBraces, cleanLLMAnswer, formatTemplate, extractUsedConstructs } = require("./agentUtils.js")
const { agentState } = require("./agentState.js")
const { logger } = require("../utils/logger")

async function planner(state) {
    let llm = LLMFactory.createLLM(state["llmType"], state["modelName"]);
    const importedConstructsCode = extractUsedConstructs(state["inputCode"], state["importedConstructs"])
    logger.warn("agent", state["inputCode"])
    // CASO BASE: PRIMA RUN
    if (state["syntaxCheckMessage"] === undefined) {
        const userInput = `
            ## User mental state: 
            ${state["userProfile"]}

            ## Imported Code: 
            ${doubleBraces(importedConstructsCode)}

            ## Source code That you will describe: 
            ${doubleBraces(state["inputCode"])}`;

        var prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                PLANNING_SYSTEM_PROMPT
            ],
            [
                "user",
                userInput
            ],
        ]);

        state["currentAttemptNumber"] = 0;
    }
    // CASO IN CUI IL JSON PRECEDENTEMENTE GENERATO HA ERRORI SINTATTICI
    else if (state["syntaxCheckMessage"] !== "OK") {
        logger.warn("agent", "syntax error found.")
        var prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                PLANNING_SYSTEM_PROMPT
            ],
            [
                "user",
                doubleBraces("DO NOT ADD ```json in the response. This is the source code: " + state["inputCode"] + " Correct the JSON you generated before as its structure is not correct: " + state["outputString"])
            ],
        ]);

        state["currentAttemptNumber"] = state["currentAttemptNumber"] + 1;
    }
    // CASO IN CUI ABBIAMO UNA CRITICA
    else if (state["critique"] !== "OK") {
        logger.warn("agent", "critique found.")
        var prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                PLANNING_SYSTEM_PROMPT
            ],
            [
                "user",
                doubleBraces("DO NOT ADD ```json in the response. This is the source code: " + state["inputCode"] + " This is your older answer: " + state["outputString"] + " this is my critique for you: " + state["critique"])
            ],
        ]);

        state["currentAttemptNumber"] = state["currentAttemptNumber"] + 1;
    }

    let response;

    try {
        const chain = prompt.pipe(llm);
        response = await chain.invoke();
    } catch (error) {
        console.error("Errore durante l'invocazione della catena LLM:");
        console.error("Dettagli dell'errore:", error);
        return;
    }
    let responseString = response["content"]
    responseString = cleanLLMAnswer(responseString)

    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }
    console.log(responseString)
    return { inputCode: state["inputCode"], outputString: responseString, currentAttemptNumber: state["currentAttemptNumber"] };
}

// voglio vedere se ciò che LLM ha generato è un JSON
async function syntaxCheckNode(state) {
    try {
        JSON.parse(state["outputString"])
    } catch (err) {
        logger.error("agent", `JSON was not correct - error: ${err}`)
        return { syntaxCheckMessage: `The following string does not represent a correct JSON, please correct it. ${state["outputString"]}` }
    }
    return { syntaxCheckMessage: `OK`, outputStructure: JSON.parse(state["outputString"]) }
}

async function critiqueNode(state) {
    let llm = LLMFactory.createLLM(state["llmType"], state["modelName"]);

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            CRITIQUE_SYSTEM_PROMPT
        ],
        [
            "user",
            doubleBraces("Respond only with OK or NOT OK. This is the structure: \n" + doubleBraces(JSON.stringify(state["outputStructure"])))
        ],
    ]);

    const chain = prompt.pipe(llm);
    let response = await chain.invoke();

    let critiqueResponseString = response.toString()
    critiqueResponseString = cleanLLMAnswer(critiqueResponseString)
    console.log("critique response = ", critiqueResponseString)

    if (!critiqueResponseString) {
        return { inputCode: state["inputCode"] };
    }

    return { critique: critiqueResponseString };
}

async function isCritiqueOK(state) {
    if (state["critique"] === "OK" || state["critique"] === "\nOK") { // sistemare questa cosa
        return END;
    }
    else
        if (state["currentAttemptNumber"] > state["maxAttempts"]) {
            return END
        }
    return "plannerNode"
}

async function isSyntaxOK(state) {
    if (state["syntaxCheckMessage"] === "OK") {
        //return "critiqueNode";
        return END;
    }
    else
        if (state["currentAttemptNumber"] > state["maxAttempts"]) {
            return END
        }

    return "plannerNode"
}

const agent = new StateGraph(agentState)
    .addNode("plannerNode", planner)
    .addNode("syntaxCheck", syntaxCheckNode)
    .addNode("critiqueNode", critiqueNode)
    .addEdge(START, "plannerNode")
    .addEdge("plannerNode", "syntaxCheck")
    .addConditionalEdges("syntaxCheck", isSyntaxOK)
    .addConditionalEdges("critiqueNode", isCritiqueOK);

module.exports = { agent };