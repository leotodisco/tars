const vscode = require('vscode');

/**
 * Tars configuration command
 * @param {vscode.ExtensionContext} context
 */
function configureTars(context) {
    const panel = vscode.window.createWebviewPanel(
        "configuration",
        "TARS Configuration",
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = viewPanel();

    panel.webview.onDidReceiveMessage(
        async (message) => {
            if (message.type === "modelConfig") {
                const answers = message.value.answers;

                // ✅ convert array → stable object schema
                const config = {
                    llmName: answers.find(x => x.question === "LLM")?.answer || null,
                    llmType: "openai",
                    apiKey: answers.find(x => x.question === "OpenAI API Key")?.answer || null
                };

                await context.globalState.update("tarsConfiguration", config);

                vscode.window.showInformationMessage("Configuration saved!");
            }
        },
        undefined,
        context.subscriptions
    );
}

function viewPanel() {
    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Configurazione TARS</title>

        <style>
            body {
                font-family: sans-serif;
                padding: 20px;
                background-color: #1e1e1e;
                color: #ffffff;
            }

            h2 { color: #4fc3f7; }

            label {
                display: block;
                margin-top: 15px;
                font-weight: bold;
            }

            input, select {
                width: 100%;
                padding: 10px;
                margin-top: 5px;
                box-sizing: border-box;
                border-radius: 6px;
                border: 1px solid #555;
                background-color: #2d2d2d;
                color: white;
            }

            button {
                margin-top: 25px;
                padding: 12px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                width: 100%;
            }

            button:hover {
                background-color: #005fa3;
            }

            .container {
                max-width: 500px;
                margin: auto;
            }

            .description {
                font-size: 12px;
                color: #bbbbbb;
                margin-top: 5px;
            }
        </style>
    </head>

    <body>
        <div class="container">
            <h2>TARS LLM Configuration</h2>

            <label for="llmName">OpenAI Model</label>
            <select id="llmName">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>

            <div class="description">
                Select the OpenAI model to use inside TARS.
            </div>

            <label for="apiKey">OpenAI API Key</label>
            <input type="password" id="apiKey" placeholder="sk-...">

            <div class="description">
                Your API key will be stored inside VSCode global state.
            </div>

            <button onclick="submitConfig()">Save configuration</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function submitConfig() {
                const llmName = document.getElementById("llmName").value;
                const apiKey = document.getElementById("apiKey").value;

                if (!apiKey || apiKey.trim() === "") {
                    alert("Please insert your OpenAI API Key.");
                    return;
                }

                vscode.postMessage({
                    type: "modelConfig",
                    value: {
                        answers: [
                            { question: "LLM", answer: llmName },
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

/**
 * Recupera config salvata
 */
function getSavedConfig(context) {
    return context.globalState.get("tarsConfiguration") || null;
}

/**
 * Flush config
 */
async function flushConfiguration(context) {
    await context.globalState.update("tarsConfiguration", undefined);
    vscode.window.showInformationMessage("TARS configuration cleared");
}

/**
 * Show config safely
 */
function showConfig(context) {
    const config = context.globalState.get("tarsConfiguration");

    if (!config) {
        vscode.window.showInformationMessage("No TARS configuration found");
        return;
    }

    const configString = [
        `- LLM: ${config.llmName ?? "not set"}`,
        `- Type: ${config.llmType ?? "not set"}`,
        `- OpenAI API: ${config.apiKey ? "******" : "not set"}`
    ].join("\n");

    console.log(configString);
}

module.exports = {
    configureTars,
    flushConfiguration,
    showConfig,
    getSavedConfig
};