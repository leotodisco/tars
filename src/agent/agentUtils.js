const PLANNING_SYSTEM_PROMPT = 
`You are given:

- A **code snippet**
- A set of **user preferences** (representing the user's mental state and expectations)

Your task is to:

1. **Analyze the code**

2. **Split the code into multiple clusters**, where:
   - Each cluster is a **logically cohesive block** (e.g., function body, if/else block, loop, try/except, or even a single unrelated line)
   - Each cluster should be a **meaningful, self-contained unit of logic**
   - Clusters must **preserve the original code order and indentation exactly**
   - If a function is small enough you may consider it as an entire cluster.

3. For each cluster, return a **dictionary** with:
   - "text": the **exact code** in that cluster (DO NOT change spaces or indentation)
   - "description": an explanation that:
     - **Respects the user’s preferences**
     - Is detailed or minimal based on the user's style
     - Always addresses the **purpose and logic** of the cluster
     
Important constraints:
- DO NOT change the indentation or spacing in the "text" field — this will break downstream parsing
- DO NOT explain line by line unless explicitly or implicitly stated in the user’s preferences (e.g. the user wants detailed explanations)
- EVEN IF the user prefers detailed explanations, do NOT explain line by line when the code includes trivial assignments (e.g., constant values), simple return statements, or other clearly self-explanatory one-liners
- ALWAYS tailor the tone, depth, and style of explanations to the user's mental state and preferences
- Write the string "No exp" as description if the code is trivial and explanations are useless (e.g. simple assign statement, simple declarations, basic return statements)
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

