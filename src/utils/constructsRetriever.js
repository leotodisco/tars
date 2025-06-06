const vscode = require('vscode');
const { logger } = require("./logger")
const path = require('path');


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

		let enrichedSymbols = [];
		let methodSymbols = [];

		for (const symbol of symbols) {
			if (symbol.kind === vscode.SymbolKind.Class) {
				const methods = extractAllFunctionsFromClass(symbol);

				if (methods.length === 0) {
					// Classe senza metodi → includila interamente
					enrichedSymbols.push(symbol);
				} else {
					// Classe con metodi → includi solo definizione campi
					const classStart = symbol.range.start;
					const firstMethodStart = methods
						.map(m => m.range.start.line)
						.sort((a, b) => a - b)[0];

					const classEndBeforeMethods = new vscode.Position(firstMethodStart, 0);
					const fieldRange = new vscode.Range(classStart, classEndBeforeMethods);

					const fieldOnlySymbol = {
						...symbol,
						range: fieldRange
					};

					enrichedSymbols.push(fieldOnlySymbol);
					methodSymbols.push(...methods);
				}
			} else {
				enrichedSymbols.push(symbol);
			}
		}

		const allSymbols = [...enrichedSymbols, ...methodSymbols];
		const constructs = allSymbols.map(symbol => {
			const { start, end } = symbol.range;
			let sourceCode;
			let rng;

			if (start.line === end.line) {
				// Prendi l'intera riga
				const lineText = document.lineAt(start.line).text;
				sourceCode = lineText.trimEnd();

				const lineEndCharacter = lineText.length;
				rng = new vscode.Range(
					new vscode.Position(start.line, 0),
					new vscode.Position(start.line, lineEndCharacter)
				);
			} else {
				sourceCode = document.getText(symbol.range);
				rng = symbol.range;
			}

			return {
				name: symbol.name,
				type: getSymbolKindName(symbol.kind),
				sourceCode,
				range: rng,
			};
		});

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
		for (const construct of constructs) {
			console.log(`--- ${construct.name} (${construct.type}) ---`);
			console.log(`Range: [${construct.range.start.line}:${construct.range.start.character}] -> [${construct.range.end.line}:${construct.range.end.character}]`);
			console.log(construct.sourceCode);
			console.log('------------------------------------------\n');
		}

		return constructs;
	} catch (error) {
		logger.error("retriever", error.toString())
	}
}

function extractPythonMainBlock(document) {
	const code = document.getText();
	const regex = /if\s+__name__\s*==\s*["']__main__["']:\n((?:[ \t]+(?:.*)?\n?)*)/;
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

async function extractImportedConstructs(document) {
	const importPaths = extractImports(document);

	const functionsMap = {};

	for (const relPath of importPaths) {
		try {
			const excludePattern = `{**/node_modules/**,**/__pycache__/**,**/*.env,**/.env*,**/*.pyc,**/.git/**,**/dist/**,**/build/**,**/venv/**,**/env/**,**/virtualenv/**,**/env/**}`;
			const uris = await vscode.workspace.findFiles(`**/${relPath}`, excludePattern, 1);

			if (uris.length === 0) {
				console.warn(`Non trovato: ${relPath}`);
				continue;
			}

			const fileUri = uris[0];
			const doc = await vscode.workspace.openTextDocument(fileUri);
			console.log("### URI = ", doc.uri)
			const symbols = await vscode.commands.executeCommand(
				"vscode.executeDocumentSymbolProvider",
				doc.uri
			);

			if (Array.isArray(symbols)) {
				const functionSymbols = symbols.filter(
					symbol =>
						symbol.kind === vscode.SymbolKind.Function ||
						symbol.kind === vscode.SymbolKind.Method ||
						symbol.kind === vscode.SymbolKind.Class ||
						symbol.kind === vscode.SymbolKind.Interface

				);

				functionSymbols.forEach(symbol => {
					if (symbol.kind !== vscode.SymbolKind.Class &&
						symbol.kind !== vscode.SymbolKind.Interface
					) {
						const cleanName = symbol.name.split('(')[0].trim();
						const sourceCode = doc.getText(symbol.range);
						functionsMap[cleanName] = { "code": sourceCode, "filePath": relPath };
					}
					else {
						const functions = extractAllFunctionsFromClass(symbol)
						console.log(`ALL FUNCTIONS FOUND: ${functions}`)
						if (!Array.isArray(functions)) {
							logger.warn("FUNCTIONS IS NOT ARRAY")
							return
						}

						for (const func of functions) {
							console.log(`FUNCTION FOUND: ${func}`)
							const cleanName = func.name.split('(')[0].trim();
							const sourceCode = doc.getText(func.range);
							functionsMap[cleanName] = { "code": sourceCode, "filePath": relPath };
						}


					}
				});
			}
		} catch (error) {
			console.warn(`Errore su: ${relPath}`, error);
		}
	}
	return functionsMap
}

function extractImports(document) {
	const language = document.languageId;
	const text = document.getText();
	let imports = [];

	if (language === "python") {
		const regex = /(?:import|from)\s+([\w\.]+)/g;
		let match;
		while ((match = regex.exec(text)) !== null) {
			const module = match[1];
			// Converti in path (senza prendere i simboli dopo "import ... import x, y")
			const modulePath = module.replace(/\./g, "/") + ".py";
			const fileName = path.basename(modulePath);
			imports.push(fileName);
		}
	} else if (language === "javascript" || language === "typescript") {
		const requireRegex = /require\(['"](.+?)['"]\)/g;
		const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
		let match;

		const addImportVariants = (modulePath) => {
			const variants = new Set();
			variants.add(modulePath);

			if (!modulePath.endsWith('.js') && !modulePath.endsWith('.ts')) {
				variants.add(modulePath + '.js');
			}

			for (const variant of variants) {
				// Escludiamo moduli esterni (es: 'fs', 'lodash')
				if (variant.startsWith('.') || variant.startsWith('/')) {
					const cleanName = path.basename(variant);
					imports.push(cleanName);
				}
			}
		};

		while ((match = requireRegex.exec(text)) !== null) {
			addImportVariants(match[1]);
		}

		while ((match = importRegex.exec(text)) !== null) {
			addImportVariants(match[1]);
		}
	}
	else if (language === "c" || language === "cpp") {
		const regex = /#include\s+["](.+?)["]/g;
		let match;
		while ((match = regex.exec(text)) !== null) {
			imports.push(match[1]);
		}
	}
	else if (language === "java") {
		const importRegex = /import\s+([\w\.]+);/g;
		let match;

		while ((match = importRegex.exec(text)) !== null) {
			const module = match[1];

			// Ignora classi standard della Java API
			if (!module.startsWith("java.") && !module.startsWith("javax.")) {
				const relativePath = module.replace(/\./g, "/") + ".java";
				const fileName = path.basename(relativePath); // 🔥 solo "MyClass.java"
				imports.push(fileName);
			}
		}
	}

	return imports;
}

function extractAllFunctionsFromClass(symbol) {
	const result = [];

	if (!symbol || typeof symbol !== "object" || !Array.isArray(symbol.children)) {
		return result;
	}

	const traverse = (node) => {
		if (
			node.kind === vscode.SymbolKind.Function ||
			node.kind === vscode.SymbolKind.Method
		) {
			result.push(node);
		}

		if (node.children && node.children.length > 0) {
			for (const child of node.children) {
				traverse(child);
			}
		}
	};

	// Avvia ricorsione dai figli della classe
	for (const child of symbol.children) {
		traverse(child);
	}

	return result;
}

module.exports = {
	findConstructs,
	extractImportedConstructs,
	extractAllFunctionsFromClass
}