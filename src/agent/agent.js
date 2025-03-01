const { Annotation } = require("@langchain/langgraph");
const { END, START } = require("@langchain/langgraph");
const { AIMessage, BaseMessage } = require("@langchain/core/messages");
const { StateGraph } = require("@langchain/langgraph");
const { HumanMessage } = require("@langchain/core/messages");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Ollama } = require("@langchain/ollama");

const { MyCustomChatModel, MyCustomChatModelInput } = require("./myCustomChatModel");
const PLANNING_SYSTEM_PROMPT = `You are provided with a piece of code. Your task is to analyze it and split it into multiple clusters, where each cluster represents a group of code snippets that are highly related in functionality, logic, or purpose.
eturn a list of dictionaries, where the list follows this structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which you describe in natural language what the cluster of code does)"
}}
In the description when you end a sentence, you must add the escape \n
    •	A cluster can be a multi-line block of code or a single line of code if it has a distinct function or purpose.
    •	Examples of clusters are: if body, functions, else body, classes, for loops body... 
    •	The code must be divided into multiple clusters, not just a single one. Generate as many clusters as possible.
    •	Do not change the order of the code. The clusters must be extracted while preserving the original sequence in which the code was written.
    •	Do not include any introductory text or explanations—only return the structured list.
    •	Do not include \`\`\`json or any useless text, I must parse your output with a formatter so dont add useless text.
`;

function doubleBraces(input) {
    return input.replace(/[\{\}]/g, match => match + match);
}

const AgentState = Annotation.Root({
  // messages: Annotation({
  //   reducer: (x, y) => x.concat(y),
  //   default: () => [],
  // }),
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