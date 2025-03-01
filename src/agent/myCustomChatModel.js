const { SimpleChatModel } = require("@langchain/core/language_models/chat_models");

async function loadHuggingFace() {
  const { HfInference } = await import("@huggingface/inference");
  return new HfInference("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");
}

  class MyCustomChatModelInput {
    model="";
  }
  
  class MyCustomChatModel extends SimpleChatModel {
    model="";
  
    constructor(fields) {
      super(fields);
      this.model = fields.model;
    }
  
    _llmType() {
      return "custom";
    }
  
    async _call(
      messages,
      options,
      runManager
    ) {
      if (!messages.length) {
        throw new Error("No messages provided.");
      }
    
      if (!messages[1] || typeof messages[1].content !== "string") {
        throw new Error("Multimodal messages are not supported or second message is missing.");
      }
      let newMessages = messages.map( (m) => {
        return {
          "role": m.getType() === "human" ? "user" : m.getType(), 
          "content": m.content.toString()
        };
      });
      const client =  await loadHuggingFace();
      console.log("new  messages = ", newMessages);
      let chatCompletion;
      try {
        chatCompletion = await client.chatCompletion({
          model: this.model,
          messages: newMessages,
          temperature: 0,
          max_tokens: 4096,
          top_p: 0.7
        });
    
        if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0] || !chatCompletion.choices[0].message) {
          throw new Error("Invalid response from Hugging Face API.");
        }
      } catch (error) {
        throw new Error(`Hugging Face API call failed: ${error}`);
      }
      if(chatCompletion.choices[0].message.content === undefined){
        return "errore";
      }
    
      return chatCompletion.choices[0].message.content;
    }
  
    /*
    TO DO MAKE IT STREAM
    async *_streamResponseChunks(
      messages: BaseMessage[],
      options: this["ParsedCallOptions"],
      runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk> {
      if (!messages.length) {
        throw new Error("No messages provided.");
      }
      if (typeof messages[0].content !== "string") {
        throw new Error("Multimodal messages are not supported.");
      }
      // Pass `runManager?.getChild()` when invoking internal runnables to enable tracing
      // await subRunnable.invoke(params, runManager?.getChild());
      for (const letter of messages[0].content.slice(0, this.code))) {
        yield new ChatGenerationChunk({
          message: new AIMessageChunk({
            content: letter,
          }),
          text: letter,
        });
        // Trigger the appropriate callback for new chunks
        await runManager?.handleLLMNewToken(letter);
      }
    }
    */
  }

module.exports = { MyCustomChatModelInput, MyCustomChatModel };