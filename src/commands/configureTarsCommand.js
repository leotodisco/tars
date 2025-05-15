const vscode = require('vscode');

/**
 * Tars configuration command
 * @param {vscode.ExtensionContext} context
 */
function configureTars(context) {
    const panel = vscode.window.createWebviewPanel(
        "configuration",
        "TARS Configuration",
        vscode.ViewColumn.One, //try beside
        { enableScripts: true }
    );

    panel.webview.html = viewPanel(panel.webview, context);

    // Listener per ricevere i dati dalla WebView
    panel.webview.onDidReceiveMessage(
        async (message) => {
            if (message.type === "modelConfig") {
                const answers = message.value.answers;
                await context.globalState.update("tarsConfiguration", answers);
                vscode.window.showInformationMessage("Configurazione salvata con successo!");
            }
        },
        undefined,
        context.subscriptions
    );
}

function viewPanel(webview, context) {
    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Configurazione TARS</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { color: #007acc; }
            label { display: block; margin-top: 15px; font-weight: bold; }
            input, select {
                width: 100%;
                padding: 8px;
                margin-top: 5px;
                box-sizing: border-box;
            }
            button {
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: #005fa3;
            }
            #apiKeyContainer {
                margin-top: 10px;
                display: none;
            }
        </style>
    </head>
    <body>
        <h2>Configurazione Modello LLM</h2>

        <label for="llmName">Nome del modello</label>
        <input type="text" id="llmName" placeholder="es. GPT-4, Mistral 7B">

        <label for="llmType">Tipo di utilizzo</label>
        <select id="llmType" onchange="toggleApiKeyField()">
            <option value="local">Locale</option>
            <option value="api">API (OpenAI)</option>
        </select>

        <div id="apiKeyContainer">
            <label for="apiKey">OpenAI API Key</label>
            <input type="password" id="apiKey" placeholder="sk-...">
        </div>

        <button onclick="submitConfig()">Salva configurazione</button>

        <script>
            const vscode = acquireVsCodeApi();

            function toggleApiKeyField() {
                const type = document.getElementById("llmType").value;
                const apiField = document.getElementById("apiKeyContainer");
                apiField.style.display = type === "api" ? "block" : "none";
            }

            function submitConfig() {
                const llmName = document.getElementById("llmName").value;
                const llmType = document.getElementById("llmType").value;
                const apiKey = llmType === "api" ? document.getElementById("apiKey").value : "N/A";

                vscode.postMessage({
                    type: "modelConfig",
                    value: {
                        answers: [
                            { question: "LLM", answer: llmName },
                            { question: "LLM Type", answer: llmType },
                            { question: "OpenAI API Key", answer: apiKey }
                        ]
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
    let savedAnswers = context.globalState.get("tarsConfiguration") || [];
    savedAnswers.push({ question, answer });
    await context.globalState.update("tarsConfiguration", savedAnswers);
}

/**
 * Funzione per recuperare le risposte salvate
 * @param {vscode.ExtensionContext} context
 */
function getSavedAnswers(context) {
    return context.globalState.get("tarsConfiguration") || [];
}

/**
 * @param {vscode.ExtensionContext} context
 */
function flushConfiguration(context) {
    context.globalState.update("tarsConfiguration", null)
}

/**
 * @param {vscode.ExtensionContext} context
 */
function showConfig(context) {
    let configState = context.globalState.get('tarsConfiguration');
    const configString = [
        `- LLM: ${configState[0]["answer"]}`,
        `- Type: ${configState[1]["answer"]}`,
        `- OpenAI API: ${configState[2]["answer"]}`,
    ].join("\n");

    vscode.window.showInformationMessage(configString)
}

module.exports = {
    configureTars,
    flushConfiguration,
    showConfig
};