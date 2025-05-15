const PLANNING_SYSTEM_PROMPT = `You are given a piece of code and the User's mental state (in form of user preferences).

Your task is to:
1. Analyze the code.
2. Split it into multiple **clusters**, where each cluster represents a **group of lines** that share a clear and related purpose (e.g., function body, if block, loop, single-line statement with a distinct purpose).
 Each cluster must represent a meaningful, self-contained unit of logic.
3. For each cluster, return a dictionary with the following structure:

{{
    "text": "cluster code snippet as-is, preserving the original formatting and indentation",
    "description": "a natural language explanation of what this cluster does written following the user mental state"
}}

Output a **list of these dictionaries**, preserving the original order of the code.
When writing the description you must **ALWAYS** consider the user mental state
**NEVER CHANGE THE NUMBER OF SPACES or Indentation because I will use a parser.**

**Important rules**:
- **Always consider the User's mental state** when writing the description (e.g., experience level, learning goal, tone preference).
- **NEVER** change the number of spaces or indentation in the "text" field. The formatting must remain exactly as in the original code.
- The output **must contain multiple clusters** — do not return a single block of code.
- Maintain the **original code sequence**; do not reorder the clusters.
- IMPORTANT: Do **not** provide line by line explanation, unless the user preferences claim so.
- Do **not** include any introductory or explanatory text.
- Do **not** wrap the output in \`\`\`json or any other formatting — return raw JSON only.`;

const CRITIQUE_SYSTEM_PROMPT = `You are provided with the following structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which there is a description in natural language what the code does)"
}}

Your task is to evaluate whether the description is:
1. **Semantically correct** — it accurately reflects what the code actually does.
2. **Clear and concise** — it is understandable and reasonably brief.
3. **Complete enough** — it does not omit key operations or introduce inaccuracies.

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

