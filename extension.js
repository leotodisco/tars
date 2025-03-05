const { LLMType} = require("./src/agent/agentState.js")
const vscode = require('vscode');
const { agent } = require("./src/agent/agent");
const fs = require('fs'); // Use this to print image later
const { findConstructs } = require("./src/utils/constructsRetriever")
const { findMatches } = require("./src/utils/stringUtils")


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const explainCodeCommand = vscode.commands.registerCommand('tars.explain-code', async () => {
		const document = vscode.window.activeTextEditor?.document;
		const editor = vscode.window.activeTextEditor;
		if (document === undefined) {
			return;
		}
		console.log("STARTED")
		
		// Invoco agent
		const agentInstance = agent.compile();

		//print agent image
		const drawableGraph = await agentInstance.getGraphAsync()
		const png = await drawableGraph.drawMermaidPng()
		const arrayBuffer = await png.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const filePath = '/Users/leopoldotodisco/Desktop/MasterThesis/tars/conditional-graph.png';
		fs.writeFileSync(filePath, buffer);

		// run the agent
		const constructs = await findConstructs(document);
		if (constructs.length > 0) {
			for (var construct of constructs) {
				const startIndex = document.getText().indexOf(construct.sourceCode);
				const endIndex = startIndex + construct.sourceCode.length;
				const startPosition = document.positionAt(startIndex);
				const endPosition = document.positionAt(endIndex);
				vscode.window.showWarningMessage(
					`${construct.name}, Start Line: ${startPosition.line}, End Line: ${endPosition.line}`
				);
				const agentResponse = await agentInstance.invoke({
					modelName: "qwen2.5-coder:3b",
					inputCode: construct.sourceCode,
					llmType: LLMType.OLLAMA
				});

				let outputList = [];
				const outputStructure = agentResponse["outputStructure"];
				if (Array.isArray(outputStructure)) {
					outputList = outputStructure; // Se è un array, lo usiamo direttamente
				} else if (outputStructure !== null && outputStructure !== undefined) {
					outputList = [outputStructure]; // Se è un singolo valore, lo trasformiamo in array
				}

				for (const element of outputList) {
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
				
						// 2️⃣ Posizione fissa per la colonna della spiegazione
						//const fixedColumn = maxLineLength + 5; // Colonna fissa dopo la riga più lunga + margine
						const fixedColumn = 180
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

				//break;
			}
		}
		else {
			return;
			// TO DO GESTIRE MANDANDO INTERO TESTO
		}
		return;
	});

	context.subscriptions.push(explainCodeCommand);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
