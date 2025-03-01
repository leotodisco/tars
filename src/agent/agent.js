const { Annotation } = require("@langchain/langgraph");
const { END, START } = require("@langchain/langgraph");
const { AIMessage, BaseMessage } = require("@langchain/core/messages");
const { StateGraph } = require("@langchain/langgraph");
const { HumanMessage } = require("@langchain/core/messages");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Ollama } = require("@langchain/ollama");
const { MyCustomChatModel, MyCustomChatModelInput } = require("./myCustomChatModel");
const { PLANNING_SYSTEM_PROMPT } = require("./prompts.js");

function doubleBraces(input) {
    return input.replace(/[\{\}]/g, match => match + match);
}

const AgentState = Annotation.Root({
  inputCode: Annotation(),
  outputStructure: Annotation(),
  syntaxCheck: Annotation(),
  critique: Annotation()
});

async function planner(state) {
    console.log("---GENERATE---");
    console.log(state);
    // if using a reasoning model -> RESPONSE.split("</think>\n").pop();
    const llm = new MyCustomChatModel({ model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B" });
    
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
            doubleBraces("DO NOT ADD ```json in the response. Respond only with the list of dictionaries because I will Parse it. This is the python code: " + state["inputCode"])
        ],
    ]);
    
    const chain = prompt.pipe(llm);
    let response = await chain.invoke({});
    
    console.log(response.content.toString());
    let responseString = response.content.toString().split("</think>\n").pop();
    // let responseString = response.toString().split("```json").pop();
    // responseString = response.toString().split("```")[0];
    if (!responseString) {
        return { inputCode: state["inputCode"] };
    }

    return { inputCode: state["inputCode"], outputStructure: JSON.parse(responseString) };
}

const agent = new StateGraph(AgentState)
    .addNode("planner", planner);
agent.addEdge(START, "planner").addEdge("planner", END);

module.exports = { agent};