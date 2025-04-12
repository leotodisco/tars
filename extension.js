const { LLMType } = require("./src/agent/agentState.js")
const vscode = require('vscode');
const { agent } = require("./src/agent/agent");
const fs = require('fs'); // Use this to print image later
const { findConstructs } = require("./src/utils/constructsRetriever")
const { findMatches } = require("./src/utils/stringUtils")
const {
	normalizeOutputStructure,
	decorateExplanation
} = require('./src/utils/extensionUtils');

const { runTomQuiz, flushUserMind } = require("./src/tom/tomQuiz.js")


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const explainCodeCommand = vscode.commands.registerCommand('tars.explain-code', async () => {
		const editor = vscode.window.activeTextEditor;
		const document = vscode.window.activeTextEditor?.document;
		if (document === undefined) {
			return;
		}
		console.log("STARTED")
		const agentInstance = agent.compile();

		//print agent image
		const drawableGraph = await agentInstance.getGraphAsync()
		const png = await drawableGraph.drawMermaidPng()
		const arrayBuffer = await png.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const filePath = '/Users/leopoldotodisco/Desktop/MasterThesis/tars/conditional-graph.png';
		fs.writeFileSync(filePath, buffer);

		// controlla se nel contesto dell'estensione è presente lo stato mentale dell'utente
		let userMind = context.globalState.get('userMind');
		console.log("\n\n\n")
		console.log(userMind)
		console.log("\n\n\n")
		if (!userMind) {
			await runTomQuiz(context);
			userMind = context.globalState.get('userMind');
		}

		let contextString = "programming experience: " + userMind[0]["answer"] +
			" role: " + userMind[1]["answer"] +
			" The user is using this LLM: " + userMind[2]["answer"] +
			" The user wants the explanation that are: " + userMind[3]["answer"] +
			" The is very confident in: " + userMind[4]["answer"] +
			" The goal of the user is to: " + userMind[5]["answer"] +
			" Use the following tone: " + userMind[6]["answer"]

		// find all the constructs in the document
		const constructs = await findConstructs(document);
		if (constructs.some(construct =>
			construct.type === "Method" ||
			construct.type === "Function" ||
			construct.type === "Class"
		)) {
			// for each construct run the agent
			for (var construct of constructs) {
				const agentResponse = await agentInstance.invoke({
					modelName: "qwen2.5:3b",
					inputCode: construct.sourceCode,
					llmType: LLMType.OLLAMA,
					maxAttempts: 4,
					userProfile: contextString
				});
				const outputList = normalizeOutputStructure(agentResponse["outputStructure"]);
				let elementIndex = -1;
				for (const element of outputList) {
					elementIndex += 1;
					const matchText = element["text"];
					if (document.getText(construct.range).includes(matchText)) {
						decorateExplanation(editor, document, element, elementIndex, matchText);
					}
				}
			}
		}
		else {
			const agentResponse = await agentInstance.invoke({
				modelName: "qwen2.5:3b",
				inputCode: document.getText(),
				llmType: LLMType.OLLAMA,
				userProfile: contextString
			});

			const outputList = normalizeOutputStructure(agentResponse["outputStructure"]);
			let elementIndex = -1;

			for (const element of outputList) {
				elementIndex += 1;
				const matchText = element["text"];
				if (document.getText(construct.range).includes(matchText)) {
					decorateExplanation(editor, document, element, elementIndex, matchText);
				}
			}
			return;
		}
		return;
	});

	const flushState = vscode.commands.registerCommand('tars.flush', async () => {
		flushUserMind(context);
	});

	const tomQuiz = vscode.commands.registerCommand('tars.tom', async () => {
		await runTomQuiz(context);
	})

	context.subscriptions.push(explainCodeCommand);
	context.subscriptions.push(flushState);
	context.subscriptions.push(tomQuiz);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
