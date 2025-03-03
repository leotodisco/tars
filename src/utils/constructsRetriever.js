const vscode = require('vscode');
const { logger } = require("./logger")

async function findConstructs(document) {
    if (!document) {
        logger.error("retriever", "Document is null")
        return null;
    }
    try {
        const symbols = await vscode.commands.executeCommand(
            "vscode.executeDocumentSymbolProvider",
            document.uri
        );

        if (!Array.isArray(symbols) || symbols.length === 0) {
            logger.error("retriever", "no symbols found")
            return [];
        }

        const constructs = symbols.map((symbol) => ({
            name: symbol.name,
            type: getSymbolKindName(symbol.kind),
            sourceCode: document.getText(symbol.range),
            range: symbol.range,
        }));

        if (constructs.length === 0) {
            logger.error("retriever", "constructs is empty")
        }

        if (document.languageId === "python") {
            const mainBlock = extractPythonMainBlock(document);
            if (mainBlock) {
                const startIndex = document.getText().indexOf(mainBlock);
				const endIndex = startIndex + mainBlock.length;
                const startPosition = document.positionAt(startIndex);
                const endPosition = document.positionAt(endIndex);
                const mainRange = new vscode.Range(startPosition, endPosition);

                constructs.push({
                    name: "__main__",
                    type: "Main Block",
                    sourceCode: mainBlock,
                    range: mainRange
                });
            }
        }

        return constructs;
    } catch (error) {
        logger.error("retriever", error.toString())
    }
}

function extractPythonMainBlock(document) {
	const code = document.getText();
	const regex = /if\s+__name__\s*==\s*["']__main__["']:(\n(?:\s+.+\n?)*)/;
	const match = code.match(regex);

	return match ? match[0] : null;
}

function getSymbolKindName(kind) {
    const symbolKinds = {
        [vscode.SymbolKind.Function]: "Function",
        [vscode.SymbolKind.Variable]: "Variable",
        [vscode.SymbolKind.Constant]: "Constant",
        [vscode.SymbolKind.Class]: "Class",
        [vscode.SymbolKind.Method]: "Method",
        [vscode.SymbolKind.Property]: "Property",
        [vscode.SymbolKind.Interface]: "Interface",
        [vscode.SymbolKind.Constructor]: "Constructor",
        [vscode.SymbolKind.Enum]: "Enum",
        [vscode.SymbolKind.Module]: "Module",
        [vscode.SymbolKind.Namespace]: "Namespace",
        [vscode.SymbolKind.Package]: "Package",
        [vscode.SymbolKind.Struct]: "Struct",
        [vscode.SymbolKind.TypeParameter]: "TypeParameter",
        [vscode.SymbolKind.Field]: "Field",
    };

    return symbolKinds[kind] || "Unknown";
}

module.exports = {
    findConstructs
}