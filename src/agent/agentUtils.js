const PLANNING_SYSTEM_PROMPT = 
`You are given:

- A **code snippet**, typically a function/method/class
- A set of **user preferences** (representing the user's mental state and expectations)

Your task is to:

1. Split the code into multiple clusters, where:
   - Each cluster must be a logically cohesive block, meaning it represents a self-contained unit of purpose or behavior.
   - A helpful rule of thumb is to consider the entire body of each control structure—like an if block, a for loop, or a try/except—as one cluster, because these structures usually encapsulate a single, self-contained logical operation.
   For example:
     - the entire body of an if, else, or elif block
     - the entire body of a for or while loop
     - the entire body of a try, except, or finally block
   - Do NOT create single-line clusters unless absolutely necessary (e.g., an isolated return or assert statement with no adjacent logic).
   - Prefer grouping consecutive simple lines together into a single cluster when they belong to the same logical flow.
   - Clusters must preserve the original code order and indentation exactly

2. For each cluster identified, return a **dictionary** with:
   - "text": the **exact code** in that cluster (DO NOT change spaces or indentation)
   - "description": an explanation that:
     - **Respects the user’s preferences**
     - Is detailed or minimal based on the user's style
     - Always addresses the **purpose and logic** of the cluster

Important constraints:
- DO NOT change the indentation or spacing in the "text" field — this will break downstream parsing
- DO NOT explain line by line unless the user explicitly requests it in their preferences
- DO NOT describe simple, self-evident lines such as:
  - Constant assignments (e.g. x = 5)
  - Basic return statements (e.g. return result)
  - Obvious initializations (e.g. count = 0)
  - Simple list/dictionary creation without logic
- When a line is trivial or meaningless to explain alone, simply write:
  - "description": "No exp"
- Describe **why the logic exists** and **what each block is doing**, not how each syntax element works unless the user is using you to learn a new language.
- The sum of all clusters is the exact SAME input code 

The output must be readable, purposeful, and adapted to the mental model and expectations of the user.
`;

const CRITIQUE_SYSTEM_PROMPT = `You are provided with the following structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which there is a description in natural language what the code does)"
}}

Your task is to evaluate whether the description is **Semantically correct** — it accurately reflects what the code actually does.

Respond as follows:
- If the description is correct, complete, and clear, reply with **only**: OK  
- If the description is incorrect, incomplete, or misleading in any way, reply with: NOT OK 
and then, provide a revised version of the description.

Do not include any introductory or explanatory text.
Focus only on the correctness and quality of the description.`;


/**
 * Escapes all curly braces in a string by doubling them.
 * @param {string} input - The input string containing curly braces.
 * @returns {string} - The string with all `{` and `}` doubled (i.e., escaped).
 */
function escapeCurlyBraces(input) {
    return input.replace(/[\{\}]/g, match => match + match);
}

/**
 * This function removes unnecessary tokens from the LLM Answers
 * @param {import("@langchain/core/messages").MessageContent} LLMAnswer
 */
function cleanLLMAnswer(LLMAnswer, programmingLanguage = "") {
    // Deepseek-specific cleaning
    let responseString = LLMAnswer.toString().split("</think>\n").pop();

    // check if this starts with ```json or ```language
    if (responseString.startsWith('\`\`\`json') || responseString.startsWith(' \`\`\`json') || responseString.startsWith('\n\`\`\`json')) {
        responseString = responseString.toString().split("```json").pop();
        responseString = responseString.toString().split("```")[0];
    }

    if (responseString.startsWith(`\`\`\`${programmingLanguage}`)) {
        responseString = responseString.toString().split(`\`\`\`${programmingLanguage}`).pop();
        responseString = responseString.toString().split("```")[0];
    }

    return responseString
}

function formatTemplate(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return key in values ? values[key] : match;
    });
}

function extractUsedConstructs(inputCode, importedConstructs) {
    const usedCodes = [];

    for (const [funcName, data] of Object.entries(importedConstructs)) {
        const regex = new RegExp(`\\b${funcName}\\b`, 'g');
        if (regex.test(inputCode)) {
            usedCodes.push(data.code);
        }
    }

    return usedCodes.join("\n\n");
}

module.exports = {
    PLANNING_SYSTEM_PROMPT,
    CRITIQUE_SYSTEM_PROMPT,
    doubleBraces: escapeCurlyBraces,
    cleanLLMAnswer,
    formatTemplate,
    extractUsedConstructs
}

