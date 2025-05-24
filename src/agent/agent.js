const { END, START } = require("@langchain/langgraph");
const { StateGraph } = require("@langchain/langgraph");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { LLMFactory } = require("./llmFactory");
const { PLANNING_SYSTEM_PROMPT, CRITIQUE_SYSTEM_PROMPT } = require("./agentUtils.js");
const { doubleBraces, cleanLLMAnswer, formatTemplate, extractUsedConstructs } = require("./agentUtils.js")
const { agentState } = require("./agentState.js")
const { logger } = require("../utils/logger")
const vscode = require('vscode');
const { z } = require('zod')
const { ChatOpenAI } = require("@langchain/OpenAI");

async function planner(state) {
    const schema = z.object({
        results: z.array(
            z.object({
                text: z.string().describe("Code snippet exactly as has been sent from the user (no change in indentation or spaces)"),
                description: z.string().describe("A natural language description of what the code does written in a way that follows the user preferences.")
            })
        ).describe("A list of code snippets with their descriptions")
    }).describe("An object containing a list of results");

    let llm = new ChatOpenAI({
        apiKey: state["llmAPI"],
        model: state["modelName"],
        temperature: 0,
        maxTokens: 10000,
        maxRetries: 5
    }).withStructuredOutput(schema, {
        strict: true,
    });

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
        logger.warn("agent", `${state["critique"]}`)
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
        vscode.window.showErrorMessage(`Error during Agent execution: ${error} `);
        throw new Error(error.message);
    }
    console.log("####")
    console.log("Type:", typeof response);
    let responseString = response
    const list = response.results ?? [];
    // const jsonList = list.map(item => ({
    //     text: item.text ?? "",
    //     description: item.description ?? ""
    // }));
    const jsonList = list.map(item => ({
        text: (item.text ?? "").trimStart(),
        description: item.description ?? ""
    }));

    // Convertila in una stringa JSON formattata
    const newResponseString = JSON.stringify(jsonList, null, 2);

    console.log(newResponseString);
    // responseString = cleanLLMAnswer(responseString)

    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }
    console.log(`RESPONSE STRING = ${responseString}`)
    return {
        inputCode: state["inputCode"],
        outputString: newResponseString,
        currentAttemptNumber: state["currentAttemptNumber"]
    };
}

// voglio vedere se ciò che LLM ha generato è un JSON
async function syntaxCheckNode(state) {
    let parsed;

    try {
        parsed = JSON.parse(state["outputString"]);

        if (Array.isArray(parsed)) {
            parsed.forEach((item, index) => {
                if (typeof item["text"] === "string") {
                    parsed[index]["text"] = item["text"].trimStart();
                }
            });
        } else {
            logger.warn("agent", "Expected a list of JSON objects, got a single object.");
            if (typeof parsed["text"] === "string") {
                parsed["text"] = parsed["text"].trimStart();
            }
        }
    } catch (err) {
        logger.error("agent", `JSON was not correct - error: ${err}`);
        return {
            syntaxCheckMessage: `The following string does not represent a correct JSON, please correct it. ${state["outputString"]}`
        };
    }

    return {
        syntaxCheckMessage: "OK",
        outputStructure: parsed
    };
}

async function critiqueNode(state) {
    let llm = await LLMFactory.createLLM(state["llmType"], state["modelName"], state["llmAPI"]);

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
    let critiqueResponseString = response["content"]
    critiqueResponseString = cleanLLMAnswer(critiqueResponseString)
    console.log("critique response = ", critiqueResponseString)

    if (!critiqueResponseString) {
        return { inputCode: state["inputCode"] };
    }

    return { critique: critiqueResponseString };
}

async function isCritiqueOK(state) {
    if (state["critique"] === "OK" || state["critique"] === "\nOK") {
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
            vscode.window.showInformationMessage(`Can not provide explanations for ${state["inputCode"].slice(0, 30)}`)
            return END
        }

    return "plannerNode"
}

const agent = new StateGraph(agentState)
    .addNode("plannerNode", planner)
    .addNode("syntaxCheck", syntaxCheckNode)
    //.addNode("critiqueNode", critiqueNode)
    .addEdge(START, "plannerNode")
    .addEdge("plannerNode", "syntaxCheck")
//.addConditionalEdges("syntaxCheck", isSyntaxOK)
//.addConditionalEdges("critiqueNode", isCritiqueOK);

module.exports = { agent };