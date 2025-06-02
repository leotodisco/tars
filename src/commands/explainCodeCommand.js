const { LLMType } = require("../agent/agentState.js")
const vscode = require('vscode');
const { agent } = require("../agent/agent");
const fs = require('fs'); // Use this to print image later
const { findConstructs, extractImportedConstructs } = require("../utils/constructsRetriever")
const { getCachedExplanation, storeExplanation } = require("../utils/cache.js")
const { findMatches } = require("../utils/stringUtils")
const {
	normalizeOutputStructure,
	decorateExplanation,
	extensionState
} = require('../utils/extensionUtils');
const { runTomQuiz } = require("./tomCommand.js")
const { configureTars } = require("./configureTarsCommand.js")
const { toggleDecorations } = require("./toggleDecorationsCommand.js")

/**
 * Analyzes the active code editor and generates contextual explanations for 
 * relevant code constructs using a language model agent, while adapting 
 * the explanations based on the user's mental state (Theory of Mind).
 * @param {vscode.ExtensionContext} context - The VSCode extension context used to access global state and user profile.
 * @returns {Promise<void>} A promise that resolves when all constructs have been processed and decorated.
 */
async function explainCodeCommand(context) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const document = editor.document;
	const agentInstance = agent.compile();
	// clean up the editor and the extensionState
	extensionState.decorations = []
	toggleDecorations(context)

	// Retrieve tars configuration (LLM Name and APIs)
	let config = context.globalState.get('tarsConfiguration');
	if (!config) {
		await configureTars(context);
		config = context.globalState.get('tarsConfiguration');
	}

	const llmName = config[0]["answer"]
	const llmType = config[1]["answer"]
	const llmAPI = config[2]["answer"]

	// Retrieve user profile (Theory Of Mind stuff)
	let userMind = context.globalState.get('userMind');
	if (!userMind) {
		await runTomQuiz(context);
		userMind = context.globalState.get('userMind');
	}
	// builds the user mental state string
	const userMindString = [
		`- programming experience: ${userMind[0]["answer"]}`,
		`- role: ${userMind[1]["answer"]}`,
		`- The user is using this LLM: ${userMind[2]["answer"]}`,
		`- The user wants the explanation that are: ${userMind[3]["answer"]}`,
		`- The user is very confident in: ${userMind[4]["answer"]}`,
		`- The goal of the user is to: ${userMind[5]["answer"]}`,
		`- Use the following tone: ${userMind[6]["answer"]}`
	].join("\n");

	const selection = editor.selection;
	const hasSelection = selection && !selection.isEmpty;
	const constructs = await findConstructs(document); // use vsCode parser
	let targets;

	// consider only the highlighted code if any
	// otherwise consider the entire file 
	if (hasSelection) {
		targets = [{
			sourceCode: document.getText(selection),
			range: selection
		}];
	} else {
		const isConstructBased = constructs.some(c =>
			c.type === "Method" || c.type === "Function" || c.type === "Class"
		);

		targets = isConstructBased ? constructs : [{
			sourceCode: document.getText(),
			range: new vscode.Range(0, 0, document.lineCount, 0)
		}];
	}

	// find functions/classes/methods from other files that are imported in the current file
	const importedConstructs = await extractImportedConstructs(document)

	// invoke agent for each construct found
	vscode.window.showInformationMessage("Starting Agent...")
	let elementIndex = 0;
	for (const construct of targets) {
		const cached = getCachedExplanation(construct.sourceCode);
		let outputList;
		if (cached) {
			outputList = normalizeOutputStructure(cached);
		}
		else {
			let agentResponse;
			try {
				agentResponse = await agentInstance.invoke({
					modelName: llmName,
					inputCode: construct.sourceCode,
					llmType: llmType === "api" ? LLMType.OPENAI : LLMType.OLLAMA,
					maxAttempts: 3,
					userProfile: userMindString,
					llmAPI: llmAPI,
					importedConstructs: importedConstructs
				});
			} catch (error) {
				console.error("Error during agent invocation:", error);
			}
			outputList = normalizeOutputStructure(agentResponse["outputStructure"]);
			storeExplanation(construct.sourceCode, outputList);
		}


		// show decorations in editor
		for (const element of outputList) {
			elementIndex += 1;
			const matchText = element["text"];
			const rawText = document.getText(construct.range).replace(/\s+/g, ' ').trim();
			const matchClean = matchText.replace(/\s+/g, ' ').trim();

			if (rawText.includes(matchClean)) {
				// "No exp" is the response that the LLM gives if it has no a meaningful explanation for the input code.
				// in that case we must not show the explanation
				if (element["description"] === "No exp") {
					element["description"] = "   "
				}
				// The decorations returned by decorateExplanation are applied and stored in the shared extension state.
				// This enables toggling, clearing, or reapplying.
				extensionState.decorations.push(...decorateExplanation(editor, document, element, elementIndex, matchText));
				extensionState.decorationsVisible = true;
			}
			else {
				// Just for debug purpose
				vscode.window.showInformationMessage(
					`❌ No match found.\n` +
					`Element text: ${element["text"]}\n` +
					`Range: from line ${construct.range.start.line} to ${construct.range.end.line}\n` +
					`Text in document: ${document.getText(construct.range)}`
				);

				console.log(
					`--❌ No match found:
					• Element text    : ${element["text"]}
					• Range           : from line ${construct.range.start.line} to ${construct.range.end.line}
					• Text in document:
  					${document.getText(construct.range)}`
				);


			}
		}
	}
}

module.exports = { explainCodeCommand };