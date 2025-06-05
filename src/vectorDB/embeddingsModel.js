const { OllamaEmbeddings } = require("@langchain/ollama");

const embeddings = new OllamaEmbeddings({
    model: "mxbai-embed-large:335m-v1-fp16",
    baseUrl: "http://localhost:11434",
});

module.exports = {
    embeddings
}