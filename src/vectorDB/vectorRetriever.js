const vscode = require("vscode");
const path = require("path")
const { retrieveDocuments } = require("./vectorStore.js")

async function retrieve(query = "crea_area_assistenza") {
    // keep these 2 lines if I want to use Chroma
    // const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ".";
    // const collectionName = path.basename(rootPath); 
    const documents = await retrieveDocuments(query)

    console.log("@@@ DEBUG")
    for (const doc of documents) {
        console.log(`* ${doc.pageContent}\n\n\n`);
    }

    return documents;
}

module.exports = {
    retrieve
}
