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
		"Theory Of Mind Profiler",
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	panel.webview.html = getQuizHtml(panel.webview, context);

	// Listener per ricevere i dati dalla WebView
	panel.webview.onDidReceiveMessage(
		async (message) => {
			if (message.type === "quizResponse") {
				await saveAnswer(context, message.value["answer"], message.value["question"]);
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
			<h2>What is your programming experience level?</h2>
			<button onclick="sendAnswer('Beginner', 'What is your programming experience level?')">Beginner</button>
			<button onclick="sendAnswer('Intermediate', 'What is your programming experience level?')">Intermediate</button>
			<button onclick="sendAnswer('Expert', 'What is your programming experience level?')">Expert</button>
			<button onclick="sendAnswer('Mentor/Professional', 'What is your programming experience level?')">Mentor/Professional</button>

			<h2>What is your current role?</h2>
			<button onclick="sendAnswer('Student', 'What is your current role?')">Student</button>
			<button onclick="sendAnswer('Junior Developer', 'What is your current role?')">Junior Developer</button>
			<button onclick="sendAnswer('Senior Developer', 'What is your current role?')">Senior Developer</button>
			<button onclick="sendAnswer('Researcher', 'What is your current role?')">Researcher</button>

			<h2>Why are you using this extension?</h2>
			<button onclick="sendAnswer('To learn a language', 'Why are you using this extension?')">To learn a language</button>
			<button onclick="sendAnswer('To boost productivity', 'Why are you using this extension?')">To boost productivity</button>
			<button onclick="sendAnswer('To prepare for an exam or interview', 'Why are you using this extension?')">To prepare for an exam or interview</button>
			<button onclick="sendAnswer('To write cleaner code', 'Why are you using this extension?')">To write cleaner code</button>

			<h2>How do you prefer to receive explanations?</h2>
			<button onclick="sendAnswer('Short and direct', 'How do you prefer to receive explanations?')">Short and direct</button>
			<button onclick="sendAnswer('Detailed and technical', 'How do you prefer to receive explanations?')">Detailed and technical</button>

			<h2>Which languages do you mainly use?</h2>
			<button onclick="sendAnswer('JavaScript', 'Which languages do you mainly use?')">JavaScript</button>
			<button onclick="sendAnswer('Python', 'Which languages do you mainly use?')">Python</button>
			<button onclick="sendAnswer('TypeScript', 'Which languages do you mainly use?')">TypeScript</button>
			<button onclick="sendAnswer('C++', 'Which languages do you mainly use?')">C++</button>
			<button onclick="sendAnswer('Java', 'Which languages do you mainly use?')">Java</button>
			<button onclick="sendAnswer('Other', 'Which languages do you mainly use?')">Other</button>

			<h2>What is your main goal with this extension?</h2>
			<button onclick="sendAnswer('Learning new things', 'What is your main goal with this extension?')">Learning new things</button>
			<button onclick="sendAnswer('Saving time', 'What is your main goal with this extension?')">Saving time</button>
			<button onclick="sendAnswer('Better understanding my code', 'What is your main goal with this extension?')">Better understanding my code</button>
			<button onclick="sendAnswer('Getting real-time development help', 'What is your main goal with this extension?')">Getting real-time development help</button>

			<h2>What tone do you prefer from the assistant?</h2>
			<button onclick="sendAnswer('Friendly', 'What tone do you prefer from the assistant?')">Friendly</button>
			<button onclick="sendAnswer('Professional', 'What tone do you prefer from the assistant?')">Professional</button>
			<button onclick="sendAnswer('Neutral', 'What tone do you prefer from the assistant?')">Neutral</button>


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

/**
 * Funzione per recuperare le risposte salvate
 * @param {vscode.ExtensionContext} context
 */
function getSavedAnswers(context) {
	return context.globalState.get("userMind") || [];
}

/**
 * @param {vscode.ExtensionContext} context
 */
function flushUserMind(context) {
	context.globalState.update("userMind", null)
}

/**
 * @param {vscode.ExtensionContext} context
 */
function showUserMentalState(context) {
	let userMind = context.globalState.get('userMind');
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
	
	vscode.window.showInformationMessage(userMindString)
}

module.exports = {
	runTomQuiz,
	getSavedAnswers,
	flushUserMind,
	showUserMentalState
};