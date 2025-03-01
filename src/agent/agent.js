const { END, START } = require("@langchain/langgraph");
const { StateGraph } = require("@langchain/langgraph");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Ollama } = require("@langchain/ollama");
const { MyCustomChatModel } = require("./myCustomChatModel");
const { PLANNING_SYSTEM_PROMPT, CRITIQUE_SYSTEM_PROMPT } = require("./agentUtils.js");
const { doubleBraces } = require("./agentUtils.js")
const { agentState } = require("./agentState.js")

const flagPrint = false

async function planner(state) {
    if (flagPrint) {
        console.log("---GENERATE---");
        console.log(state);
    }    

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
    //let response = await chain.invoke({}); check if {} is useless
    let response = await chain.invoke();
    let responseString = response.content.toString().split("</think>\n").pop();

    if (flagPrint) {
        console.log(response.content.toString());
    }

    // let responseString = response.toString().split("```json").pop();
    // responseString = response.toString().split("```")[0];
    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }

    return { inputCode: state["inputCode"], outputStructure: JSON.parse(responseString) };
}

async function critiqueNode(state) {
    if (flagPrint) {
        console.log("---CRITIQUE NODE---");
        console.log(state);
    }

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
    //console.log(response.content.toString());
    let responseString = response.content.toString().split("</think>\n\n").pop(); // todo sostituire questi \n con effettivi controlli che ignorino gli spazi 
    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }

    if (flagPrint) {
        console.log("RISPOSTA CRITICA = ", responseString)
    }

    return { critique: responseString };
}

async function isCritiqueOK(state) {
    if (state["critique"] === "OK") {
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