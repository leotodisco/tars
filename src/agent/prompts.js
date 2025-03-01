const PLANNING_SYSTEM_PROMPT = `You are provided with a piece of code. Your task is to analyze it and split it into multiple clusters, where each cluster represents a group of code snippets that are highly related in functionality, logic, or purpose.
return a list of dictionaries, where the list follows this structure:
{{
    "text": "code snippet in a string format",
    "description": "description (max 3 lines of text in which you describe in natural language what the cluster of code does)"
}}
In the description when you end a sentence, you must add the escape \n
    •	A cluster can be a multi-line block of code or a single line of code if it has a distinct function or purpose.
    •	Examples of clusters are: if body, functions, else body, classes, for loops body... 
    •	The code must be divided into multiple clusters, not just a single one. Generate as many clusters as possible.
    •	Do not change the order of the code. The clusters must be extracted while preserving the original sequence in which the code was written.
    •	Do not include any introductory text or explanations—only return the structured list.
    •	Do not include \`\`\`json or any useless text, I must parse your output with a formatter so don't add useless text.
`;


module.exports = {
    PLANNING_SYSTEM_PROMPT
}