const vscode = require('vscode');
const { agent } = require("./src/agent/agent");
const { logger } = require("./src/utils/logger")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const explainCodeCommand = vscode.commands.registerCommand('tars.explain-code', async () => {
		const document = vscode.window.activeTextEditor?.document;
		if (document === undefined) {
			return;
		}
		let text = document?.getText();
		if (!text) {
			logger.error("text is undefined");
			return;
		}

		// Invoco agent
		const agentInstance = agent.compile();
		let risposta = await agentInstance.invoke({
			inputCode: text
		});
		// stampo in editor le varie cose
		let resultString = "";
		let newRisposta = risposta["outputStructure"]; //lista di JSON

		if (Array.isArray(newRisposta)) {
			for (const dictionary of newRisposta) {
				{

					resultString = resultString.concat(`\n"""\n`);
					resultString = resultString.concat(dictionary["description"]);
					resultString = resultString.concat(`\n"""\n`);
					resultString = resultString.concat(dictionary["text"]);

				}
			}
		}

		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		const start = new vscode.Position(0, 0);
		const end = new vscode.Position(
			document.lineCount - 1,
			document.lineAt(document.lineCount - 1).text.length
		);
		const fullRange = new vscode.Range(start, end);

		editor.edit(editBuilder => {
			editBuilder.replace(fullRange, resultString);
		});

	});

	context.subscriptions.push(explainCodeCommand);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
