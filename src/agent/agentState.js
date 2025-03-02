const { Annotation } = require("@langchain/langgraph");

const agentState = Annotation.Root({
    document: Annotation(),
    inputCode: Annotation(),
    outputStructure: Annotation(),
    syntaxCheck: Annotation(),
    critique: Annotation()
});

module.exports = { agentState }