const { Annotation } = require("@langchain/langgraph");

const agentState = Annotation.Root({
    document: Annotation(),
    inputCode: Annotation(),
    userProfile: Annotation(),
    outputString: Annotation(),
    outputStructure: Annotation(),
    syntaxCheckMessage: Annotation(),
    critique: Annotation(),
    modelName: Annotation(),
    llmType: Annotation(),
    maxAttempts: Annotation(),
    currentAttemptNumber: Annotation(),
    llmAPI: Annotation()
});

class LLMType {
    static OPENAI = "OpenAIModel";
    static HUGGINGFACE = "HuggingFaceModel";
    static OLLAMA = "OllamaModel";
    static DEEPSEEK = "DeepSeek";
}


module.exports = { agentState, LLMType }