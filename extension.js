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
					modelName: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
					inputCode: construct.sourceCode
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

						// 2️⃣ Divideremo il testo della spiegazione su più righe se necessario
						const maxCharsPerLine = 100; // Numero massimo di caratteri per riga della spiegazione
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

						// 3️⃣ Se la spiegazione è più corta del blocco di codice, aggiungiamo righe vuote
						while (explanationLines.length < endLine - startLine + 1) {
							explanationLines.push(""); // Aggiunge righe vuote per uniformare l'aspetto visivo
						}

						// 4️⃣ Creiamo decorazioni per ogni riga della spiegazione, tutte allineate
						let decorations = [];
						for (let i = 0; i < explanationLines.length; i++) {
							let line = startLine + i;
							if (line > endLine) break; // Non andiamo oltre il blocco di codice

							let text = explanationLines[i];

							// Calcoliamo la differenza tra la riga più lunga e la riga attuale
							let currentLineLength = document.lineAt(line).text.length;
							let difference = maxLineLength - currentLineLength;

							// Posizioniamo la spiegazione esattamente dopo la fine della riga più lunga
							const adjustedColumn = currentLineLength + difference + 5; // Aggiungiamo un margine extra

							// Creiamo una decorazione per ogni riga
							const decorationType = vscode.window.createTextEditorDecorationType({
								backgroundColor: "transparent", // Sfondo rosso trasparente su tutte le righe
								isWholeLine: false,
								//isWholeLine: true, doing so the line will be entirely covered
								after: {
									contentText: `  ${text}`, // Se il testo è vuoto, lascia spazio per mantenere l'allineamento
									color: "white",
									fontWeight: "1200",
									//backgroundColor: "transparent",
								},
								borderWidth: '0px 0px 0 2px',
								borderStyle: 'solid',
								borderSpacing: '10px',
								borderColor: "rgba(132, 205, 225, 0.92)",


							});

							// Creiamo il range sulla riga corrispondente
							const lineRange = new vscode.Range(
								new vscode.Position(line, adjustedColumn),
								new vscode.Position(line, adjustedColumn)
							);

							decorations.push({ type: decorationType, range: lineRange });
						}

						// 5️⃣ Applichiamo tutte le decorazioni
						decorations.forEach(({ type, range }) => {
							editor.setDecorations(type, [range]);
						});


					}

					else {
						console.log("\n\n no match here")
						console.log(element["text"])
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
