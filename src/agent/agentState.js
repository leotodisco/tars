const { Annotation } = require("@langchain/langgraph");

const agentState = Annotation.Root({
    inputCode: Annotation(),
    outputStructure: Annotation(),
    syntaxCheck: Annotation(),
    critique: Annotation()
});

module.exports = { agentState }