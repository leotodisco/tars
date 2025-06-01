const vscode = require("vscode");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/huggingface_transformers");
const path = require("path");
const { OllamaEmbeddings } = require("@langchain/ollama");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");


async function indexProjectCommand(context) {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ".";
    const collectionName = path.basename(rootPath);

    const directoryLoader = new DirectoryLoader(rootPath, {
        ".pdf": (filePath) => new PDFLoader(filePath),
    });

    const directoryDocs = await directoryLoader.load();
    if (!directoryDocs.length) {
        vscode.window.showWarningMessage("No PDF documents found.");
        return;
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 40,
    });

    const splitDocs = await textSplitter.splitDocuments(directoryDocs);
    const preview = splitDocs[0]?.pageContent?.slice(0, 100) || "[no content]";
    console.log(preview)

    try {
        const embeddings = new OllamaEmbeddings({
            model: "all-minilm",
            baseUrl: "http://localhost:11434",
        });
        console.log("sto per indicizzare il tutto")
        // let vectorStore = await Chroma.fromDocuments(
        //     splitDocs,
        //     embeddings,
        //     {
        //         collectionName: collectionName,
        //         url: "http://localhost:8000",
        //         collectionMetadata: {
        //             "hnsw:space": "cosine",
        //         },
        //     }
        // )
        const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings)
        console.log("✅ Vector store created");
        console.log("✅ Documents added to vector store");

        const preview = splitDocs[0]?.pageContent?.slice(0, 100) || "[no content]";
        vscode.window.showInformationMessage(`Preview: "${preview}..."`);
        vscode.window.showInformationMessage(`Project "${collectionName}" indexed correctly.`);

    } catch (e) {
        console.error("🔥 addDocuments failed:", e);

    }
}

module.exports = {
    indexProjectCommand
};