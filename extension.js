const vscode = require('vscode');
const { explainCodeCommand } = require('./src/commands/explainCodeCommand')
const { runTomQuiz, flushUserMind } = require("./src/tom/tomQuiz.js")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const commands = [
		{ name: 'tars.explain-code', callback: () => explainCodeCommand(context) },
		{ name: 'tars.flush', callback: () => flushUserMind(context) },
		{ name: 'tars.tom', callback: () => runTomQuiz(context) }
	];

	commands.forEach(({ name, callback }) => {
		const disposable = vscode.commands.registerCommand(name, callback);
		context.subscriptions.push(disposable);
	});
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
