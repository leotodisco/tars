const vscode = require("vscode");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const path = require("path");
const { addDocuments } = require("../vectorDB/vectorStore.js")


async function indexProjectCommand(context) {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ".";
    // const collectionName = path.basename(rootPath); keep this line for Chroma DB migration

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
    await addDocuments(splitDocs);
    vscode.window.showInformationMessage("Project Completely Indexed")
    return;
}

module.exports = {
    indexProjectCommand
};