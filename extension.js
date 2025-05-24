const vscode = require('vscode');
const { explainCodeCommand } = require('./src/commands/explainCodeCommand')
const { runTomQuiz, flushUserMind, showUserMentalState } = require("./src/commands/tomCommand.js")
const { configureTars, showConfig, flushConfiguration } = require("./src/commands/configureTarsCommand.js")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const commands = [
		{ name: 'tars.explain-code', callback: () => explainCodeCommand(context) },
		{ name: 'tars.flush', callback: () => flushUserMind(context) },
		{ name: 'tars.tom', callback: () => runTomQuiz(context) },
		{ name: 'tars.logUserMind', callback: () => showUserMentalState(context) },
		{ name: 'tars.configure-tars', callback: () => configureTars(context) },
		{ name: 'tars.flush-tars-config', callback: () => flushConfiguration(context) },
		{ name: 'tars.show-tars-config', callback: () => showConfig(context) }
	];

	commands.forEach(({ name, callback }) => {
		const disposable = vscode.commands.registerCommand(name, callback);
		context.subscriptions.push(disposable);
	});
	vscode.window.showInformationMessage("Task Completed!")
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
