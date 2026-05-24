const vscode = require("vscode");
const path = require("path")
const { retrieveDocuments } = require("./vectorStore.js")

async function retrieve(query) {
    // keep these 2 lines if I want to use Chroma
    // const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ".";
    // const collectionName = path.basename(rootPath);
    try {
        const documents = await retrieveDocuments(query);

        return documents;
    } catch (error) {
        console.error("Failed to retrieve documents:", error);
        return [];
    }
}

module.exports = {
    retrieve
}
