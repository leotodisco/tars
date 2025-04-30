const { ChatOllama } = require("@langchain/ollama");
const { ChatOpenAI } = require("@langchain/OpenAI");
const { logger } = require("../utils/logger");
const { LLMType } = require("./agentState");
require('dotenv').config({'path': "/Users/leopoldotodisco/Desktop/MasterThesis/tars/src/.env"});

const LLMFactory = {
    createLLM: function (llmType, modelName) {
        let llm;

        switch (llmType) {
            case LLMType.OLLAMA:
                llm = new ChatOllama({
                    baseUrl: "http://localhost:11434",
                    model: modelName,
                    temperature: 0
                });
                break;

            case LLMType.OPENAI:
                llm = new ChatOpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                    model: modelName,
                    temperature: 0,
                    maxTokens: 4000,
                    maxRetries: 2
                });
                break;

            case LLMType.DEEPSEEK:
                llm = new ChatOpenAI({
                    model: modelName,
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