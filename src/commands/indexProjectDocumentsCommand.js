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
        ".pdf": (filePath) => new PDFLoader(filePath, { parsedItemSeparator: "" }),
    });

    const directoryDocs = await directoryLoader.load();
    if (!directoryDocs.length) {
        vscode.window.showWarningMessage("No PDF documents found.");
        return;
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""],
    });

    const splitDocs = await textSplitter.splitDocuments(directoryDocs, { appendChunkOverlapHeader: true });
    // const filteredDocs = splitDocs.filter(doc => doc.pageContent.trim().length > 0);
const cleanedDocs = splitDocs
  .map(doc => {
    const cleaned = doc.pageContent.replace(/\s+/g, ' ').trim();
    return { ...doc, pageContent: cleaned };
  })
  .filter(doc => doc.pageContent.length > 0);
    try {
        await addDocuments(cleanedDocs);
    } catch (error) {
        vscode.window.showErrorMessage(error)
        console.log(error)
    }
    vscode.window.showInformationMessage("Project Completely Indexed")
    return;
}

module.exports = {
    indexProjectCommand
};