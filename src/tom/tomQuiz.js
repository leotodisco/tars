const vscode = require('vscode');

/**
 * Mostra il quiz in una WebView e salva le risposte nel globalState
 * @param {vscode.ExtensionContext} context
 */
function runTomQuiz(context) {
	const ans = getSavedAnswers(context);
	if (ans.length > 0) {
		console.log("Profilo già presente:", ans);
		return;
	}

	const panel = vscode.window.createWebviewPanel(
		"quizWebview",
		"Quiz Interattivo",
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	panel.webview.html = getQuizHtml(panel.webview, context);

	// Listener per ricevere i dati dalla WebView
	panel.webview.onDidReceiveMessage(
		async (message) => {
			if (message.type === "quizResponse") {
				await saveAnswer(context, message.value["answer"], message.value["question"]);
				vscode.window.showInformationMessage(`Domanda: ${message.value["question"]}; Risposta: ${message.value["answer"]}`);
			}
		},
		undefined,
		context.subscriptions
	);
}

// Funzione per ottenere il contenuto HTML del quiz
function getQuizHtml(webview, context) {
	return `
		<!DOCTYPE html>
		<html lang="it">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Quiz VS Code</title>
			<style>
				body { font-family: Arial, sans-serif; padding: 20px; }
				h2 { color: #007acc; }
				button { padding: 10px 15px; margin-top: 10px; cursor: pointer; }
			</style>
		</head>
		<body>
			<h2>Qual è il tuo linguaggio di programmazione preferito?</h2>
			<button onclick="sendAnswer('JavaScript', 'Qual è il tuo linguaggio di programmazione preferito?')">JavaScript</button>
			<button onclick="sendAnswer('Python', 'Qual è il tuo linguaggio di programmazione preferito?')">Python</button>
			<button onclick="sendAnswer('C++', 'Qual è il tuo linguaggio di programmazione preferito?')">C++</button>
			<button onclick="sendAnswer('TypeScript', 'Qual è il tuo linguaggio di programmazione preferito?')">TypeScript</button>

			<script>
				const vscode = acquireVsCodeApi();
				function sendAnswer(answer, question) {
					vscode.postMessage({ type: "quizResponse", value: { question, answer } });
				}
			</script>
		</body>
		</html>
	`;
}

// Funzione per salvare la risposta dell'utente nel globalState
async function saveAnswer(context, answer, question) {
	let savedAnswers = context.globalState.get("userMind") || [];
	savedAnswers.push({ question, answer });
	await context.globalState.update("userMind", savedAnswers);
}

// Funzione per recuperare le risposte salvate
function getSavedAnswers(context) {
	return context.globalState.get("userMind") || [];
}

module.exports = {
	runTomQuiz,
	getSavedAnswers
};