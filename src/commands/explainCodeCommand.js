const { LLMType } = require("../agent/agentState.js")
const vscode = require('vscode');
const { agent } = require("../agent/agent");
const fs = require('fs'); // Use this to print image later
const { findConstructs } = require("../utils/constructsRetriever")
const { findMatches } = require("../utils/stringUtils")
const {
	normalizeOutputStructure,
	decorateExplanation
} = require('../utils/extensionUtils');
const { runTomQuiz } = require("./tomCommand.js")

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

	// Find code constructs using vsCode parser
	const constructs = await findConstructs(document);
	const isConstructBased = constructs.some(c =>
		c.type === "Method" || c.type === "Function" || c.type === "Class"
	);

    // if there are no classes/methods/functions uses the entire code in the document for the agent execution
	const targets = isConstructBased ? constructs : [{
		sourceCode: document.getText(),
		range: new vscode.Range(0, 0, document.lineCount, 0) // fallback range
	}];

    // invoke agent for each construct found
	for (const construct of targets) {
		const agentResponse = await agentInstance.invoke({
			modelName: "qwen2.5-coder:3b",
			inputCode: construct.sourceCode,
			llmType: LLMType.OLLAMA,
			maxAttempts: 3,
			userProfile: userMindString
		});

		const outputList = normalizeOutputStructure(agentResponse["outputStructure"]);
		let elementIndex = 0;

		for (const element of outputList) {
			elementIndex += 1;
			const matchText = element["text"];
			if (document.getText(construct.range).includes(matchText)) {
				decorateExplanation(editor, document, element, elementIndex, matchText);
			}
		}
	}
}

module.exports = { explainCodeCommand };