const vscode = require('vscode');

/**
 * Mostra il quiz in una WebView e salva le risposte nel globalState
 * @param {vscode.ExtensionContext} context
 */
function runTomQuiz(context) {
	const ans = getSavedAnswers(context);

	if (ans.length > 0) {
		vscode.window.showInformationMessage(
			"User profile already configured."
		);
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
				await saveAnswer(
					context,
					message.value.answer,
					message.value.question
				);
			}
		},
		undefined,
		context.subscriptions
	);
}

function getQuizHtml(webview, context) {
	return `
		<!DOCTYPE html>
		<html lang="it">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Quiz VS Code</title>

			<style>
				body {
					font-family: Arial, sans-serif;
					padding: 20px;
					background-color: #1e1e1e;
					color: white;
				}

				h2 {
					color: #4fc3f7;
					margin-top: 30px;
				}

				.button-group {
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					margin-top: 10px;
				}

				button {
					padding: 10px 15px;
					cursor: pointer;
					border: none;
					border-radius: 6px;
					background-color: #2d2d2d;
					color: white;
				}

				button:hover {
					background-color: #007acc;
				}

				.selected {
					background-color: #007acc !important;
				}
			</style>
		</head>

		<body>

			<h2>What is your programming experience level?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'Beginner', 'What is your programming experience level?')">Beginner</button>
				<button onclick="sendAnswer(this, 'Intermediate', 'What is your programming experience level?')">Intermediate</button>
				<button onclick="sendAnswer(this, 'Expert', 'What is your programming experience level?')">Expert</button>
				<button onclick="sendAnswer(this, 'Mentor/Professional', 'What is your programming experience level?')">Mentor/Professional</button>
			</div>

			<h2>What is your current role?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'Student', 'What is your current role?')">Student</button>
				<button onclick="sendAnswer(this, 'Junior Developer', 'What is your current role?')">Junior Developer</button>
				<button onclick="sendAnswer(this, 'Senior Developer', 'What is your current role?')">Senior Developer</button>
				<button onclick="sendAnswer(this, 'Researcher', 'What is your current role?')">Researcher</button>
			</div>

			<h2>Why are you using this extension?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'To learn a language', 'Why are you using this extension?')">To learn a language</button>
				<button onclick="sendAnswer(this, 'To boost productivity', 'Why are you using this extension?')">To boost productivity</button>
				<button onclick="sendAnswer(this, 'To prepare for an exam or interview', 'Why are you using this extension?')">To prepare for an exam or interview</button>
				<button onclick="sendAnswer(this, 'To write cleaner code', 'Why are you using this extension?')">To write cleaner code</button>
			</div>

			<h2>How do you prefer to receive explanations?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'Short and direct', 'How do you prefer to receive explanations?')">Short and direct</button>
				<button onclick="sendAnswer(this, 'Detailed and technical', 'How do you prefer to receive explanations?')">Detailed and technical</button>
			</div>

			<h2>Which languages do you mainly use?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'JavaScript', 'Which languages do you mainly use?')">JavaScript</button>
				<button onclick="sendAnswer(this, 'Python', 'Which languages do you mainly use?')">Python</button>
				<button onclick="sendAnswer(this, 'TypeScript', 'Which languages do you mainly use?')">TypeScript</button>
				<button onclick="sendAnswer(this, 'C++', 'Which languages do you mainly use?')">C++</button>
				<button onclick="sendAnswer(this, 'Java', 'Which languages do you mainly use?')">Java</button>
				<button onclick="sendAnswer(this, 'Other', 'Which languages do you mainly use?')">Other</button>
			</div>

			<h2>What is your main goal with this extension?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'Learning new things', 'What is your main goal with this extension?')">Learning new things</button>
				<button onclick="sendAnswer(this, 'Saving time', 'What is your main goal with this extension?')">Saving time</button>
				<button onclick="sendAnswer(this, 'Better understanding my code', 'What is your main goal with this extension?')">Better understanding my code</button>
				<button onclick="sendAnswer(this, 'Getting real-time development help', 'What is your main goal with this extension?')">Getting real-time development help</button>
			</div>

			<h2>What tone do you prefer from the assistant?</h2>
			<div class="button-group">
				<button onclick="sendAnswer(this, 'Friendly', 'What tone do you prefer from the assistant?')">Friendly</button>
				<button onclick="sendAnswer(this, 'Professional', 'What tone do you prefer from the assistant?')">Professional</button>
				<button onclick="sendAnswer(this, 'Neutral', 'What tone do you prefer from the assistant?')">Neutral</button>
			</div>

			<script>
				const vscode = acquireVsCodeApi();

				function sendAnswer(button, answer, question) {

					// reset visual selection
					const parent = button.parentElement;

					Array.from(parent.children).forEach(btn => {
						btn.classList.remove("selected");
					});

					button.classList.add("selected");

					vscode.postMessage({
						type: "quizResponse",
						value: {
							question,
							answer
						}
					});
				}
			</script>

		</body>
		</html>
	`;
}

// Funzione per salvare la risposta dell'utente nel globalState
async function saveAnswer(context, answer, question) {

	let savedAnswers =
		context.globalState.get("userMind") || [];

	// rimuove eventuale risposta precedente
	savedAnswers = savedAnswers.filter(
		item => item.question !== question
	);

	savedAnswers.push({
		question,
		answer
	});

	await context.globalState.update(
		"userMind",
		savedAnswers
	);
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
	context.globalState.update("userMind", null);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function showUserMentalState(context) {

	let userMind =
		context.globalState.get('userMind');

	if (!userMind || userMind.length === 0) {

		vscode.window.showInformationMessage(
			"No user profile found."
		);

		return;
	}

	const userMindString = [
		`- Programming experience: ${userMind[0]?.answer || "N/A"}`,
		`- Role: ${userMind[1]?.answer || "N/A"}`,
		`- Using extension for: ${userMind[2]?.answer || "N/A"}`,
		`- Preferred explanation style: ${userMind[3]?.answer || "N/A"}`,
		`- Main language: ${userMind[4]?.answer || "N/A"}`,
		`- Main goal: ${userMind[5]?.answer || "N/A"}`,
		`- Preferred tone: ${userMind[6]?.answer || "N/A"}`
	].join("\n");

	vscode.window.showInformationMessage(
		userMindString
	);
}

module.exports = {
	runTomQuiz,
	getSavedAnswers,
	flushUserMind,
	showUserMentalState
};