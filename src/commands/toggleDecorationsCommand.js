const vscode = require('vscode');
const {
	extensionState
} = require('../utils/extensionUtils');


function toggleDecorations(context) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || extensionState.decorations.length === 0) {
        vscode.window.showInformationMessage("No decorations to toggle.");
        return;
    }

    if (extensionState.decorationsVisible) {
        extensionState.decorations.forEach(({ type }) => {
            editor.setDecorations(type, []);
        });
        extensionState.decorationsVisible = false;
        vscode.window.showInformationMessage("Decorations hidden.");
    } else {
        extensionState.decorations.forEach(({ type, range }) => {
            editor.setDecorations(type, [range]);
        });
        extensionState.decorationsVisible = true;
        vscode.window.showInformationMessage("Decorations shown.");
    }
}


module.exports = {
    toggleDecorations
};