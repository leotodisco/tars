const { ChatOllama } = require("@langchain/ollama");
const { ChatOpenAI } = require("@langchain/OpenAI");
const { logger } = require("../utils/logger");
const { LLMType } = require("./agentState");
const vscode = require('vscode');
const fetch = require('node-fetch');

const LLMFactory = {
    createLLM: async function (llmType, modelName, apiKey) {
        switch (llmType) {
            case LLMType.OLLAMA:
                return await initializeOllamaModel(modelName);

            case LLMType.OPENAI:
                return new ChatOpenAI({
                    apiKey: apiKey,
                    model: modelName,
                    temperature: 0,
                    maxTokens: 1000,
                    maxRetries: 5
                });

            case LLMType.DEEPSEEK:
                return new ChatOpenAI({
                    apiKey: apiKey,
                    model: modelName,
                    temperature: 0,
                    maxTokens: 1000,
                    maxRetries: 5
                });

            default:
                throw new Error("No valid LLM type provided.");
        }
    }
};

module.exports = { LLMFactory };


async function initializeOllamaModel(modelName) {
    try {
        // 1. Verifica se Ollama è attivo
        const pingResponse = await fetch('http://localhost:11434');
        if (!pingResponse.ok) {
            vscode.window.showErrorMessage("Ollama is not running on http://localhost:11434");
            return null;
        }

        // 2. Ottieni la lista dei modelli
        const tagsRes = await fetch('http://localhost:11434/api/tags');
        const tagsJson = await tagsRes.json();
        const availableModels = tagsJson.models.map((m) => m.name);
        vscode.window.showInformationMessage(`Available Models: ${availableModels.join(", ")}`);

        if (!availableModels.includes(modelName)) {
            vscode.window.showInformationMessage(`Pulling Ollama model: ${modelName}\n It may require some time.`);
            const pullRes = await fetch('http://localhost:11434/api/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (!pullRes.ok) {
                console.log("ERRORE QUANDO PULLO KING")
                throw new Error("Errore durante il download del modello.");
            }

            vscode.window.showInformationMessage(`Model "${modelName}" successfully downloaded.`);
        } 

        return new ChatOllama({
            baseUrl: "http://localhost:11434",
            model: modelName,
            temperature: 0
        });

    } catch (err) {
        vscode.window.showErrorMessage("Errore con Ollama: " + err.message);
        return null;
    }
}