const { Annotation } = require("@langchain/langgraph");

const agentState = Annotation.Root({
    document: Annotation(),
    inputCode: Annotation(),
    outputStructure: Annotation(),
    syntaxCheck: Annotation(),
    critique: Annotation(),
    modelName: Annotation(),
    llmType: Annotation()
});

class LLMType {
    static OPENAI = "OpenAIModel";
    static HUGGINGFACE = "HuggingFaceModel";
    static OLLAMA = "OllamaModel";
    static DEEPSEEK = "DeepSeek";
}


module.exports = { agentState, LLMType }