const vscode = require('vscode');
const { agent } = require("./src/agent/agent");
const { logger } = require("./src/utils/logger")
const fs = require('fs'); // Use this to print image later
const { findConstructs } = require("./src/utils/constructsRetriever")


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
		let risposta = [];
		const constructs = await findConstructs(document);
		if (constructs.length > 0) {
			for (var construct of constructs) {
				vscode.window.showWarningMessage(
					`Costrutto: ${construct.name}`
				);
				const agentResponse = await agentInstance.invoke({
					inputCode: construct.sourceCode
				});
				risposta.push(agentResponse["outputStructure"]);

				let outputList = [];
				const outputStructure = agentResponse["outputStructure"];
				if (Array.isArray(outputStructure)) {
					outputList = outputStructure; // Se è un array, lo usiamo direttamente
				} else if (outputStructure !== null && outputStructure !== undefined) {
					outputList = [outputStructure]; // Se è un singolo valore, lo trasformiamo in array
				}

				for (const element of outputList) {
					if (document.getText().includes(element["text"])) {
						console.log("trovato match")
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
								backgroundColor: "rgba(255, 0, 0, 0.2)", // Sfondo rosso trasparente su tutte le righe
								isWholeLine: true,
								after: {
									contentText: `| ${text}`, // Se il testo è vuoto, lascia spazio per mantenere l'allineamento
									color: "white",
									fontWeight: "bold",
									backgroundColor: "rgba(0, 0, 0, 0.7)", // Box scuro
									border: "0px 0px 1px 0px solid gray",
								},
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
				}

			}
		}
		else {
			return;
			risposta.push(await agentInstance.invoke({
				inputCode: document.getText()
			}));
		}
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
