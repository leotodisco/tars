const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { embeddings } = require("./embeddingsModel.js");


let vectorStore = new MemoryVectorStore(embeddings);

// Just in case I want to use Chroma DB:
//
// const vectorStore = new Chroma(embeddings, {
//     collectionName,
//     url: "http://localhost:8000",
//     collectionMetadata: {
//         "hnsw:space": "cosine",
//     },
// });
//

let retriever = vectorStore.asRetriever({
  k: 2
})



async function addDocuments(documents) {
  await vectorStore.addDocuments(documents);
  console.log("Documents added to DB")
}

async function retrieveDocuments(query) {
  const similaritySearchResults = await vectorStore.similaritySearchVectorWithScore(await embeddings.embedQuery(query), 3)
  //const similaritySearchResults = await retriever.invoke(query);
  return similaritySearchResults;
}

function flushDB() {
  if (vectorStore && Array.isArray(vectorStore.memoryVectors)) {
    vectorStore.memoryVectors.length = 0;
    console.log("MemoryVectorStore cleared.");
  } else {
    console.warn("No valid MemoryVectorStore found.");
  }
}

module.exports = {
  addDocuments,
  retrieveDocuments,
  flushDB
}
