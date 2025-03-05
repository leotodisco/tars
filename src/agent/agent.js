const { END, START } = require("@langchain/langgraph");
const { StateGraph } = require("@langchain/langgraph");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { LLMFactory } = require("./llmFactory");
const { PLANNING_SYSTEM_PROMPT, CRITIQUE_SYSTEM_PROMPT } = require("./agentUtils.js");
const { doubleBraces, cleanLLMAnswer } = require("./agentUtils.js")
const { agentState } = require("./agentState.js")




async function planner(state) {
    //const llm = new MyCustomChatModel({ model: state["modelName"] });
    let llm = LLMFactory.createLLM(state["llmType"], state["modelName"]);
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            PLANNING_SYSTEM_PROMPT
        ],
        [
            "user",
            doubleBraces("DO NOT ADD ```json in the response. Respond only with the list of dictionaries because I will Parse it. This is the source code: " + state["inputCode"])
        ],
    ]);

    const chain = prompt.pipe(llm);
    let response = await chain.invoke();
    let responseString = response.toString()
    responseString = cleanLLMAnswer(responseString)

    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }

    return { inputCode: state["inputCode"], outputStructure: JSON.parse(responseString) };
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
        return "plannerNode"
}

const agent = new StateGraph(agentState)
    .addNode("plannerNode", planner)
//.addNode("critiqueNode", critiqueNode);

agent.addEdge(START, "plannerNode").addEdge("plannerNode", END)
//.addEdge("plannerNode", "critiqueNode")
//.addConditionalEdges("critiqueNode", isCritiqueOK);

module.exports = { agent };