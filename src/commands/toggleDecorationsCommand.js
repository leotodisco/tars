const vscode = require('vscode');
const {
    extensionState
} = require('../utils/extensionUtils');


function toggleDecorations(context) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || extensionState.decorations.length === 0) {
        return;
    }

    if (extensionState.decorationsVisible) {
        extensionState.decorations.forEach(({ type }) => {
            editor.setDecorations(type, []);
        });
        extensionState.decorationsVisible = false;
    } else {
        extensionState.decorations.forEach(({ type, range }) => {
            editor.setDecorations(type, [range]);
        });
        extensionState.decorationsVisible = true;
    }
}


module.exports = {
    toggleDecorations
};