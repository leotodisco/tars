const vscode = require('vscode');
const { explainCodeCommand } = require('./src/commands/explainCodeCommand')
const { runTomQuiz, flushUserMind, showUserMentalState } = require("./src/commands/tomCommand.js")
const { configureTars, showConfig, flushConfiguration } = require("./src/commands/configureTarsCommand.js")
const { helpCommand } = require("./src/commands/helpCommand.js")
const { toggleDecorations } = require("./src/commands/toggleDecorationsCommand.js")
const { indexProjectCommand } = require("./src/commands/indexProjectDocumentsCommand.js")
const { retrieve } = require("./src/vectorDB/chromaRetriever.js")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// TODO initialize chrome vector db instance if not present
	const commands = [
		{
			name: 'tars.explain-code', callback: async () => {
				await explainCodeCommand(context);
				vscode.window.showInformationMessage("Task Completed!");
			}
		},
		{ name: 'tars.flush', callback: () => flushUserMind(context) },
		{ name: 'tars.tom', callback: () => runTomQuiz(context) },
		{ name: 'tars.logUserMind', callback: () => showUserMentalState(context) },
		{ name: 'tars.configure-tars', callback: () => configureTars(context) },
		{ name: 'tars.flush-tars-config', callback: () => flushConfiguration(context) },
		{ name: 'tars.show-tars-config', callback: () => showConfig(context) },
		{ name: 'tars.help-command', callback: () => helpCommand(context) },
		{ name: 'tars.toggle-decorations', callback: () => toggleDecorations(context) },
		{ name: 'tars.index-project', callback: () => indexProjectCommand(context) },
		{ name: 'tars.retrieve', callback: () => retrieve("crea_area_assistenza") },
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
