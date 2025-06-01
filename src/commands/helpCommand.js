const vscode = require('vscode');

/**
 * Tars configuration command
 * @param {vscode.ExtensionContext} context
 */
function helpCommand(context) {
    vscode.window.showInformationMessage(
        `🤖 Tars Help:
- "Configure Tars": Set up your API key, model, and other configuration options.
- "Explain Code": Select a piece of code and get a detailed natural language explanation.
- "Flush Tars State": Reset internal state and clear any temporary cache or data.
- "Theory Of Mind Profiler": Run a ToM-based profiling analysis of the code.`
    );
}

module.exports = {
    helpCommand
};