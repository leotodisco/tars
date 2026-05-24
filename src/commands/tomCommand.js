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

	panel.webview.onDidReceiveMessage(
		async (message) => {

			if (message.type === "saveConfig") {
				const answers = message.value;

				for (const [question, answer] of Object.entries(answers)) {
					await saveAnswer(context, answer, question);
				}

				vscode.window.showInformationMessage(
					"Configuration saved successfully!"
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

				.save-btn {
					margin-top: 30px;
					padding: 12px 18px;
					background-color: #007acc;
					border-radius: 8px;
					font-weight: bold;
				}
			</style>
		</head>

		<body>

			<h2>What is your programming experience level?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'What is your programming experience level?', 'Beginner')">Beginner</button>
				<button onclick="selectAnswer(this, 'What is your programming experience level?', 'Intermediate')">Intermediate</button>
				<button onclick="selectAnswer(this, 'What is your programming experience level?', 'Expert')">Expert</button>
				<button onclick="selectAnswer(this, 'What is your programming experience level?', 'Mentor/Professional')">Mentor/Professional</button>
			</div>

			<h2>What is your current role?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'What is your current role?', 'Student')">Student</button>
				<button onclick="selectAnswer(this, 'What is your current role?', 'Junior Developer')">Junior Developer</button>
				<button onclick="selectAnswer(this, 'What is your current role?', 'Senior Developer')">Senior Developer</button>
				<button onclick="selectAnswer(this, 'What is your current role?', 'Researcher')">Researcher</button>
			</div>

			<h2>Why are you using this extension?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'Why are you using this extension?', 'To learn a language')">To learn a language</button>
				<button onclick="selectAnswer(this, 'Why are you using this extension?', 'To boost productivity')">To boost productivity</button>
				<button onclick="selectAnswer(this, 'Why are you using this extension?', 'To prepare for an exam or interview')">To prepare for an exam or interview</button>
				<button onclick="selectAnswer(this, 'Why are you using this extension?', 'To write cleaner code')">To write cleaner code</button>
			</div>

			<h2>How do you prefer to receive explanations?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'How do you prefer to receive explanations?', 'Short and direct')">Short and direct</button>
				<button onclick="selectAnswer(this, 'How do you prefer to receive explanations?', 'Detailed and technical')">Detailed and technical</button>
			</div>

			<h2>Which languages do you mainly use?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'JavaScript')">JavaScript</button>
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'Python')">Python</button>
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'TypeScript')">TypeScript</button>
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'C++')">C++</button>
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'Java')">Java</button>
				<button onclick="selectAnswer(this, 'Which languages do you mainly use?', 'Other')">Other</button>
			</div>

			<h2>What is your main goal with this extension?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'What is your main goal with this extension?', 'Learning new things')">Learning new things</button>
				<button onclick="selectAnswer(this, 'What is your main goal with this extension?', 'Saving time')">Saving time</button>
				<button onclick="selectAnswer(this, 'What is your main goal with this extension?', 'Better understanding my code')">Better understanding my code</button>
				<button onclick="selectAnswer(this, 'What is your main goal with this extension?', 'Getting real-time development help')">Getting real-time development help</button>
			</div>

			<h2>What tone do you prefer from the assistant?</h2>
			<div class="button-group">
				<button onclick="selectAnswer(this, 'What tone do you prefer from the assistant?', 'Friendly')">Friendly</button>
				<button onclick="selectAnswer(this, 'What tone do you prefer from the assistant?', 'Professional')">Professional</button>
				<button onclick="selectAnswer(this, 'What tone do you prefer from the assistant?', 'Neutral')">Neutral</button>
			</div>

			<div>
				<button class="save-btn" onclick="saveConfig()">
					Save configuration
				</button>
			</div>

			<script>
				const vscode = acquireVsCodeApi();
				const answers = {};

				function selectAnswer(button, question, answer) {

					const parent = button.parentElement;

					Array.from(parent.children).forEach(btn => {
						btn.classList.remove("selected");
					});

					button.classList.add("selected");

					answers[question] = answer;
				}

				function saveConfig() {
					vscode.postMessage({
						type: "saveConfig",
						value: answers
					});
				}
			</script>

		</body>
		</html>
	`;
}

// Funzione per salvare la risposta dell'utente nel globalState
async function saveAnswer(context, answer, question) {
  let savedAnswers = context.globalState.get("userMind") || {};

  savedAnswers[question] = answer;

  await context.globalState.update("userMind", savedAnswers);
}

/**
 * Funzione per recuperare le risposte salvate
 * @param {vscode.ExtensionContext} context
 */
function getSavedAnswers(context) {
  return context.globalState.get("userMind") || {};
}

/**
 * @param {vscode.ExtensionContext} context
 */
function flushUserMind(context) {
  context.globalState.update("userMind", {});
}

/**
 * @param {vscode.ExtensionContext} context
 */
function showUserMentalState(context) {

  let userMind = context.globalState.get('userMind');

  if (!userMind || Object.keys(userMind).length === 0) {
    vscode.window.showInformationMessage("No user profile found.");
    return;
  }

  const userMindString = [
    `- Programming experience: ${userMind["What is your programming experience level?"] || "N/A"}`,
    `- Role: ${userMind["What is your current role?"] || "N/A"}`,
    `- Using extension for: ${userMind["Why are you using this extension?"] || "N/A"}`,
    `- Preferred explanation style: ${userMind["How do you prefer to receive explanations?"] || "N/A"}`,
    `- Main language: ${userMind["Which languages do you mainly use?"] || "N/A"}`,
    `- Main goal: ${userMind["What is your main goal with this extension?"] || "N/A"}`,
    `- Preferred tone: ${userMind["What tone do you prefer from the assistant?"] || "N/A"}`
  ].join("\n");

  vscode.window.showInformationMessage(userMindString);
}

module.exports = {
	runTomQuiz,
	getSavedAnswers,
	flushUserMind,
	showUserMentalState
};