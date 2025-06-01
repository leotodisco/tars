const vscode = require("vscode");
const path = require("path")
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { MemoryVectorStore } = require( "langchain/vectorstores/memory");
const { OllamaEmbeddings } = require("@langchain/ollama");

async function retrieve(query = "crea_area_assistenza") {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ".";
    const collectionName = path.basename(rootPath);
    const embeddings = new OllamaEmbeddings({
        model: "all-minilm",
        baseUrl: "http://localhost:11434",
    });

    // const vectorStore = new Chroma(embeddings, {
    //     collectionName,
    //     url: "http://localhost:8000",
    //     collectionMetadata: {
    //         "hnsw:space": "cosine",
    //     },
    // });
    const vectorStore = new MemoryVectorStore(embeddings)
    const retriever = await vectorStore.asRetriever({
        k: 2,
    });
    const similaritySearchResults = await retriever.invoke(query);


    console.log("@@@ DEBUG")
    for (const doc of similaritySearchResults) {
        console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`);
    }

    return similaritySearchResults;
}

module.exports = {
    retrieve
}
