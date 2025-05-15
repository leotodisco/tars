const vscode = require('vscode');

/**
 * Normalizes the output structure to always return an array.
 * If the input is already an array, it is returned as is.
 * If it's a single value, it is wrapped in an array.
 * If it's null or undefined, an empty array is returned.
 *
 * @param {*} outputStructure - The response output from the agent.
 * @returns {Array} - A normalized array of outputs.
 */
function normalizeOutputStructure(outputStructure) {
    if (Array.isArray(outputStructure))
        return outputStructure;
    if (outputStructure !== null && outputStructure !== undefined)
        return [outputStructure];
    return [];
}

/**
 * Splits a long explanation into multiple lines based on a max character limit per line.
 * Words are preserved and not broken across lines.
 *
 * @param {string} text - The explanation text to split.
 * @param {number} maxCharsPerLine - Maximum number of characters allowed per line (default: 280).
 * @returns {string[]} - An array of text lines.
 */
function splitExplanationText(text, maxCharsPerLine = 280) {
    const words = text.split(" ");
    let currentLine = "";
    const lines = [];

    words.forEach(word => {
        if ((currentLine + word).length > maxCharsPerLine) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine += word + " ";
        }
    });
    lines.push(currentLine.trim());
    return lines;
}

/**
 * Calculates the maximum line length within a given range of lines in the document.
 *
 * @param {vscode.TextDocument} document - The current VSCode document.
 * @param {number} startLine - Starting line number (inclusive).
 * @param {number} endLine - Ending line number (inclusive).
 * @returns {number} - The maximum number of characters found on a single line.
 */
function getMaxLineLength(document, startLine, endLine) {
    let maxLength = 0;
    for (let line = startLine; line <= endLine; line++) {
        maxLength = Math.max(maxLength, document.lineAt(line).text.length);
    }
    return maxLength;
}

/**
 * Creates a VSCode decoration type to visually display explanations alongside code.
 *
 * @param {string} contentText - The text to display after the line.
 * @param {string} borderColor - The color of the left border of the decoration.
 * @returns {vscode.TextEditorDecorationType} - The configured decoration type.
 */
function createDecorationType(contentText, borderColor) {
    return vscode.window.createTextEditorDecorationType({
        isWholeLine: true, 
        after: {
            contentText: `  ${contentText}`,
            color: "white",
            fontWeight: "1200",
        },
        borderColor: borderColor,
        borderStyle: 'solid',
        borderWidth: '0 0 0 1px', 
    });
}

/**
 * Adds visual decorations (explanations) to the lines of code that match a given element.
 * The explanation is aligned to the right of the code and styled using alternating colors.
 *
 * @param {vscode.TextEditor} editor - The active text editor.
 * @param {vscode.TextDocument} document - The current document.
 * @param {*} element - The element containing `text` and `description`.
 * @param {number} elementIndex - Index of the element, used to alternate decoration color.
 * @param {string} matchText - The code snippet text to locate in the document.
 */
function decorateExplanation(editor, document, element, elementIndex, matchText) {
    const startIndex = document.getText().indexOf(matchText);
    const endIndex = startIndex + matchText.length;
    const startPosition = document.positionAt(startIndex);
    const endPosition = document.positionAt(endIndex);
    const range = new vscode.Range(startPosition, endPosition);
    const startLine = range.start.line;
    const endLine = range.end.line;

    const explanation = element["description"];
    let explanationLines = splitExplanationText(explanation);

    // Pad with empty lines if the explanation is shorter than the code block
    while (explanationLines.length < endLine - startLine + 1) {
        explanationLines.push(" ");
    }

    const borderColor = elementIndex % 2 === 0
    ? "rgb(255, 255, 112)"     // Giallo
    : "rgba(128, 0, 255, 1)";    // Viola

    const decorations = explanationLines
        .slice(0, endLine - startLine + 1)
        .map((text, i) => {
            const line = startLine + i;
            const type = createDecorationType(text, borderColor);
            const lineLength = document.lineAt(line).text.length;

            const lineRange = new vscode.Range(
                new vscode.Position(line, lineLength),
                new vscode.Position(line, lineLength)
            );

            return { type, range: lineRange };
        });

    decorations.forEach(({ type, range }) => {
        editor.setDecorations(type, [range]);
    });
}

module.exports = {
    normalizeOutputStructure,
    splitExplanationText,
    getMaxLineLength,
    createDecorationType,
    decorateExplanation,
};