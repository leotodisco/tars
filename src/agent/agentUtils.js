const PLANNING_SYSTEM_PROMPT = `You are provided with a piece of code. Your task is to analyze it and split it into multiple clusters, where each cluster represents a group of code snippets that are highly related in functionality, logic, or purpose.
return a list of dictionaries, where the list follows this structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which you describe in natural language what the cluster of code does)"
}}

You should avoid writing obvious descriptions, such as "function declaration".
NEVER CHANGE THE NUMBER OF SPACES or Indentation because I will use a parser.

In the description when you end a sentence, you must add the escape \n
    •	A cluster can be a multi-line block of code or a single line of code if it has a distinct function or purpose.
    •	Examples of clusters are: if body, functions, else body, classes, for loops body... 
    •	The code must be divided into multiple clusters, not just a single one. Generate as many clusters as possible.
    •	Do not change the order of the code. The clusters must be extracted while preserving the original sequence in which the code was written.
    •	Do not include any introductory text or explanations—only return the structured list.
    •	Do not include \`\`\`json or any useless text, I must parse your output with a formatter so don't add useless text.`;

const CRITIQUE_SYSTEM_PROMPT = `You are provided with the following structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which there is a description in natural language what the code does)"
}}

Your task is to verify that the description is actually Correct.
If it is not correct you must respond with "NOT OK" and provide a suggestion.
If the description is correct you must respond **ONLY** with "OK".
Do not add any introductive text.`;

function doubleBraces(input) {
    return input.replace(/[\{\}]/g, match => match + match);
}

/**
 * This function removes unnecessary tokens from the LLM Answers
 * @param {string} LLMAnswer
 */
function cleanLLMAnswer(LLMAnswer, programmingLanguage = "") {
    // Deepseek-specific cleaning
    let responseString = LLMAnswer.split("</think>\n").pop();
    
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

module.exports = {
    PLANNING_SYSTEM_PROMPT,
    CRITIQUE_SYSTEM_PROMPT,
    doubleBraces,
    cleanLLMAnswer
}