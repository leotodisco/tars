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
    const isDarkTheme =
        vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
        vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

    const textColor = isDarkTheme ? 'gray' : 'black'; // solo colore del testo

    return vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        after: {
            contentText: `  ${contentText}`,
            color: textColor,
            fontWeight: "100",
        },
        borderColor: borderColor,
        borderStyle: 'solid',
        borderWidth: '0 0 0 1px',
    });
}

function distributeExplanationAcrossLines(explanation, numberOfLines) {
    const words = explanation.trim().split(/\s+/);
    const lines = Array.from({ length: numberOfLines }, () => []);

    const wordsPerLine = Math.ceil(words.length / numberOfLines);
    let wordIndex = 0;

    for (let i = 0; i < numberOfLines && wordIndex < words.length; i++) {
        while (lines[i].length < wordsPerLine && wordIndex < words.length) {
            lines[i].push(words[wordIndex]);
            wordIndex++;
        }
    }

    return lines.map(words => words.join(" "));
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
    const matchIndices = findLooseMatchIndex(document.getText(), matchText);

    if (matchIndices.length === 0) {
        console.warn("⚠️ Match not found for matchText:");
        console.warn(matchText);
        return [];
    }

    const explanation = element["description"];
    const allDecorations = [];

    for (const startIndex of matchIndices) {
        //if the line has already been decorated skip the iteration
        if (decoratedIndexes.includes(startIndex)) {
            continue;
        }
        const endIndex = startIndex + matchText.length;
        const startPosition = document.positionAt(startIndex);
        const endPosition = document.positionAt(endIndex);
        const range = new vscode.Range(startPosition, endPosition);
        const startLine = range.start.line;
        const endLine = range.end.line;

        let explanationLines = distributeExplanationAcrossLines(explanation, endLine - startLine + 1);

        // Pad with empty lines if the explanation is shorter than the code block
        while (explanationLines.length < endLine - startLine + 1) {
            explanationLines.push(" ");
        }

        // Calculate the max line length in the code block
        const maxLineLength = Math.max(
            ...Array.from({ length: endLine - startLine + 1 }, (_, i) =>
                document.lineAt(startLine + i).text.length
            )
        );

        const borderColor = elementIndex % 2 === 0
            ? "rgb(255, 255, 112)"     // Yellow
            : "rgba(128, 0, 255, 1)";  // Purple

        const decorations = explanationLines
            .slice(0, endLine - startLine + 1)
            .map((text, i) => {
                const line = startLine + i;
                const actualLineLength = document.lineAt(line).text.length;

                // Add padding so all explanations start at the same column
                const paddingSize = maxLineLength - actualLineLength + 1;
                const padding = '\u00A0'.repeat(paddingSize);
                const paddedText = padding + text;

                const type = createDecorationType(paddedText, borderColor);

                const lineRange = new vscode.Range(
                    new vscode.Position(line, actualLineLength),
                    new vscode.Position(line, actualLineLength)
                );

                editor.setDecorations(type, [lineRange]);
                return { type, range: lineRange };
            });

        allDecorations.push(...decorations);
        decoratedIndexes.push(startIndex)
    }

    return allDecorations;
}

function normalizeChar(c) {
    // Rende uniformi spazi, tab e newline
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        return ' ';
    }
    return c;
}

function compressWhitespace(str) {
    // Converte ogni sequenza di spazi/tab/newline in un singolo spazio
    return str
        .split('')
        .map(normalizeChar)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
}

function findLooseMatchIndex(documentText, matchText) {
    const target = compressWhitespace(matchText);
    const normalizedDoc = compressWhitespace(documentText);
    const indices = [];

    let searchStart = 0;

    while (searchStart < normalizedDoc.length) {
        const semanticIndex = normalizedDoc.indexOf(target, searchStart);
        if (semanticIndex === -1) break;

        // Trova la posizione originale nel documentText corrispondente a semanticIndex
        let docIndex = 0;
        let normIndex = 0;

        while (docIndex < documentText.length && normIndex < semanticIndex) {
            const normChar = normalizeChar(documentText[docIndex]);
            if (normChar === ' ') {
                while (docIndex < documentText.length && normalizeChar(documentText[docIndex]) === ' ') {
                    docIndex++;
                }
                normIndex++;
            } else {
                docIndex++;
                normIndex++;
            }
        }

        indices.push(docIndex);

        // Sposta la ricerca più avanti per trovare il prossimo match
        searchStart = semanticIndex + target.length;
    }

    return indices;
}

let extensionState = {
    decorations: [],
    decorationsVisible: true
};

let decoratedIndexes = []

module.exports = {
    normalizeOutputStructure,
    getMaxLineLength,
    createDecorationType,
    decorateExplanation,
    extensionState,
    decoratedIndexes
};