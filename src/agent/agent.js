const { END, START } = require("@langchain/langgraph");
const { StateGraph } = require("@langchain/langgraph");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Ollama } = require("@langchain/ollama");
const { MyCustomChatModel } = require("./myCustomChatModel");
const { PLANNING_SYSTEM_PROMPT, CRITIQUE_SYSTEM_PROMPT } = require("./agentUtils.js");
const { doubleBraces, cleanLLMAnswer } = require("./agentUtils.js")
const { agentState } = require("./agentState.js")
const { logger } = require("../utils/logger.js")

async function planner(state) {
    logger.info("agent", "Planning node...");

    // if using a reasoning model -> RESPONSE.split("</think>\n").pop();
    const llm = new MyCustomChatModel({ model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B" });

    // modularità se vuoi runnare in locale o in cloud
    // const llm = new Ollama({
    //     baseUrl: "http://localhost:11434",
    //     model: "qwen2.5:0.5b"
    // });

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

    let responseString = response.content.toString()
    responseString = cleanLLMAnswer(responseString)
    logger.info("agent", response.content.toString());
    if (!responseString) {
        logger.error("agent", "planning node failed to give answer")
        return { inputCode: state["inputCode"] };
    }

    return { inputCode: state["inputCode"], outputStructure: JSON.parse(responseString) };
}

async function critiqueNode(state) {
    logger.info("agent", `Critique node...`);

    const llm = new MyCustomChatModel({ model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B" });
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

    let critiqueResponseString = response.content.toString()
    critiqueResponseString = cleanLLMAnswer(critiqueResponseString)
    logger.info("agent", response.content.toString());
    if (!critiqueResponseString) {
        logger.error("agent", "critique node failed to give answer")
        return { inputCode: state["inputCode"] };
    }

    logger.info("agent", `Critique Response: ${critiqueResponseString}`)
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
    .addNode("critiqueNode", critiqueNode);

agent.addEdge(START, "plannerNode")
    .addEdge("plannerNode", "critiqueNode")
    .addConditionalEdges("critiqueNode", isCritiqueOK);

module.exports = { agent };