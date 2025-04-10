const { LLMType } = require("./src/agent/agentState.js")
const vscode = require('vscode');
const { agent } = require("./src/agent/agent");
const fs = require('fs'); // Use this to print image later
const { findConstructs } = require("./src/utils/constructsRetriever")
const { findMatches } = require("./src/utils/stringUtils")
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
				let outputList = [];
				const outputStructure = agentResponse["outputStructure"];
				if (Array.isArray(outputStructure)) {
					outputList = outputStructure; // Se è un array, lo usiamo direttamente
				} else if (outputStructure !== null && outputStructure !== undefined) {
					outputList = [outputStructure]; // Se è un singolo valore, lo trasformiamo in array
				}
				let elementIndex = -1
				for (const element of outputList) {
					elementIndex += 1;
					//findMatches(document.getText(construct.range), element["text"])  TODO ALGORITMO DI RICERCA CUSTOM
					if (document.getText(construct.range).includes(element["text"])) {
						const startIndex = document.getText().indexOf(element["text"]);
						const endIndex = startIndex + element["text"].length;
						const startPosition = document.positionAt(startIndex);
						const endPosition = document.positionAt(endIndex);

						const range = new vscode.Range(startPosition, endPosition);
						const startLine = range.start.line;
						const endLine = range.end.line;

						const explanation = element["description"];

						// 1️⃣ Troviamo la lunghezza massima delle righe di codice selezionate
						let maxLineLength = 0;
						for (let line = startLine; line <= endLine; line++) {
							maxLineLength = Math.max(maxLineLength, document.lineAt(line).text.length);
						}

						// 3️⃣ Divideremo il testo della spiegazione su più righe se necessario
						const maxCharsPerLine = 280;
						const words = explanation.split(" ");
						let currentLine = "";
						let explanationLines = [];

						words.forEach(word => {
							if ((currentLine + word).length > maxCharsPerLine) {
								explanationLines.push(currentLine);
								currentLine = word + " ";
							} else {
								currentLine += word + " ";
							}
						});
						explanationLines.push(currentLine.trim());

						// 4️⃣ Se la spiegazione è più corta del blocco di codice, aggiungiamo righe vuote
						while (explanationLines.length < endLine - startLine + 1) {
							explanationLines.push(" ");
						}

						// 5️⃣ Creiamo decorazioni per ogni riga della spiegazione, tutte allineate alla stessa colonna
						let decorations = [];
						for (let i = 0; i < explanationLines.length; i++) {
							let line = startLine + i;
							if (line > endLine) break; // Non andiamo oltre il blocco di codice

							let text = explanationLines[i];
							const borderColor = elementIndex % 2 === 0
								? "rgba(132, 205, 225, 0.92)"
								: "rgba(12, 245, 12, 0.92)";

							// Usiamo una colonna fissa per tutte le righe
							const decorationType = vscode.window.createTextEditorDecorationType({
								backgroundColor: "transparent",
								isWholeLine: false,
								after: {
									contentText: `  ${text}`, // Testo della spiegazione
									color: "white",
									fontWeight: "1200",
								},
								borderWidth: '0px 0px 0 2px',
								borderStyle: 'solid',
								borderSpacing: '10px',
								borderColor: borderColor,
							});

							// Posizioniamo la decorazione alla colonna fissa
							const lineRange = new vscode.Range(
								new vscode.Position(line, 180),
								new vscode.Position(line, 180)
							);

							decorations.push({ type: decorationType, range: lineRange });
						}

						// 6️⃣ Applichiamo tutte le decorazioni
						decorations.forEach(({ type, range }) => {
							editor.setDecorations(type, [range]);
						});

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

			let outputList = [];
			const outputStructure = agentResponse["outputStructure"];
			if (Array.isArray(outputStructure)) {
				outputList = outputStructure; // Se è un array, lo usiamo direttamente
			} else if (outputStructure !== null && outputStructure !== undefined) {
				outputList = [outputStructure]; // Se è un singolo valore, lo trasformiamo in array
			}

			for (const element of outputList) {
				if (document.getText().includes(element["text"])) {
					const startIndex = document.getText().indexOf(element["text"]);
					const endIndex = startIndex + element["text"].length;
					const startPosition = document.positionAt(startIndex);
					const endPosition = document.positionAt(endIndex);

					const range = new vscode.Range(startPosition, endPosition);
					const startLine = range.start.line;
					const endLine = range.end.line;

					const explanation = element["description"];

					// 1️⃣ Troviamo la lunghezza massima delle righe di codice selezionate
					let maxLineLength = 0;
					for (let line = startLine; line <= endLine; line++) {
						maxLineLength = Math.max(maxLineLength, document.lineAt(line).text.length);
					}

					// 3️⃣ Divideremo il testo della spiegazione su più righe se necessario
					const maxCharsPerLine = 280;
					const words = explanation.split(" ");
					let currentLine = "";
					let explanationLines = [];

					words.forEach(word => {
						if ((currentLine + word).length > maxCharsPerLine) {
							explanationLines.push(currentLine);
							currentLine = word + " ";
						} else {
							currentLine += word + " ";
						}
					});
					explanationLines.push(currentLine.trim());

					// 4️⃣ Se la spiegazione è più corta del blocco di codice, aggiungiamo righe vuote
					while (explanationLines.length < endLine - startLine + 1) {
						explanationLines.push("");
					}

					// 5️⃣ Creiamo decorazioni per ogni riga della spiegazione, tutte allineate alla stessa colonna
					let decorations = [];
					for (let i = 0; i < explanationLines.length; i++) {
						let line = startLine + i;
						if (line > endLine) break; // Non andiamo oltre il blocco di codice

						let text = explanationLines[i];

						// Usiamo una colonna fissa per tutte le righe
						const decorationType = vscode.window.createTextEditorDecorationType({
							backgroundColor: "transparent",
							isWholeLine: false,
							after: {
								contentText: `  ${text}`, // Testo della spiegazione
								color: "white",
								fontWeight: "1200",
							},
							borderWidth: '0px 0px 0 2px',
							borderStyle: 'solid',
							borderSpacing: '10px',
							borderColor: "rgba(132, 205, 225, 0.92)",
						});

						// Posizioniamo la decorazione alla colonna fissa
						const lineRange = new vscode.Range(
							new vscode.Position(line, 180),
							new vscode.Position(line, 180)
						);

						decorations.push({ type: decorationType, range: lineRange });
					}

					// 6️⃣ Applichiamo tutte le decorazioni
					decorations.forEach(({ type, range }) => {
						editor.setDecorations(type, [range]);
					});

				}

				else {
					vscode.window.showWarningMessage(
						`Non trovato match per: ${element["text"]}`
					);
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
