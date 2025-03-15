const { Ollama } = require("@langchain/ollama");
const { OpenAI } = require("@langchain/OpenAI");
const { logger } = require("../utils/logger");
const { LLMType } = require("./agentState");

const LLMFactory = {
    createLLM: function (llmType, modelName) {
        let llm;

        switch (llmType) {
            case LLMType.OLLAMA:
                llm = new Ollama({
                    baseUrl: "http://localhost:11434",
                    model: modelName,
                    temperature: 0
                });
                logger.info("agent", "Created Ollama Model");
                break;

            case LLMType.OPENAI:
                logger.info("agent", "Created OpenAI Model");
                llm = new OpenAI({
                    modelName: modelName,
                    temperature: 0,
                    maxTokens: 1000,
                    maxRetries: 5
                });
                break;

            case LLMType.DEEPSEEK:
                logger.info("agent", "Created DeepSeek Model");
                llm = new OpenAI({
                    modelName: modelName,
                    temperature: 0,
                    maxTokens: 1000,
                    maxRetries: 5
                });
                break;

            default:
                throw new Error("No valid LLM type provided.");
        }

        return llm;
    }
};

module.exports = { LLMFactory };