# 🧠 TARS — Intelligent Code Explanations for VS Code

**TARS** is a Visual Studio Code extension that provides real-time, developer-personalized explanations of your code, powered by **LLM Agents** built with [LangGraph](https://www.langgraph.dev/).

It integrates cutting-edge concepts like **Self-Refinement**, **Theory of Mind**, and **Perspective Taking**, allowing you to receive **accurate, personalized, and visually contextualized explanations** — either locally for full privacy or via API-powered cloud models.

---

## ✨ Features

- ⚙️ **Real-Time Code Explanation**  
  Automatically analyzes and explains functions, classes, and logical blocks in natural language.

- 🧠 **Theory of Mind + Perspective Taking**  
  TARS adapts its explanations to your **experience level, goals, and preferences**. This includes a form of **Perspective Taking**, where the agent reasons based on your mental profile to communicate effectively.

- 🔁 **Self-Refinement Mechanism**  
  Before giving you an answer, the agent refines its own output using LangGraph’s stateful multi-step reasoning.

- 🖼️ **Visual Inline Explanations**  
  Explanations appear next to the code as editor decorations, making them intuitive and non-intrusive.

- 🔐 **Local or Cloud Execution**  
  Choose privacy or performance: run locally with [Ollama](https://ollama.ai), or use OpenAI / DeepSeek for broader LLM access.

---

## 🤖 Supported LLM Providers

1. **Ollama** (local — fully private)
2. **OpenAI** (via API key)
3. **DeepSeek** (via API key)

---

## 🚀 Getting Started

### 1. Install the Extension

```bash
git clone https://github.com/your-username/tars-vscode-extension.git
cd tars-vscode-extension
npm install
npm run compile
```

Then press `F5` in VS Code to launch the Extension Development Host.

---

### 2. Configure Environment Variables

Create a `.env` file in the root (or specify a path) and add:

```env
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
```

For **Ollama**, make sure the local server is running.

---

### 3. Run Required Commands

To get started with TARS, run the following commands:

#### ✅ Main Commands

- `TARS: Theory Of Mind Profiler`  
  → Starts a short quiz to personalize explanations based on your mental model.

- `TARS: Explain Code`  
  → Analyzes and explains the selected code based on your profile.

#### 🔧 Utility Commands

- `TARS: Flush Tars State`  
  → Clears all stored user profiling (useful to re-run the quiz or reset state).

- `TARS: Log User Mind`  
  → Logs the current profiling data to the console (for debugging).

---

## 🧠 What is Theory of Mind + Perspective Taking?

TARS uses a **Theory of Mind (ToM)** mechanism to model you as a user:  
Your experience level, learning goals, preferred tone, and more are captured through an initial quiz.  
Then, using **Perspective Taking**, the LLM adjusts its explanations as if it were reasoning from your point of view — just like a good teacher would.

---

## 🏗️ Architecture Overview

- 🔍 **Code Construct Parser** — Extracts functions, classes, and logical blocks using VS Code Symbol API.  
- 🔄 **LangGraph Agent** — Powers the self-refining loop and perspective-aware reasoning.  
- 🧠 **ToM Profiler** — Captures your mental state and injects it into agent prompts.  
- 🎯 **Decorator Engine** — Renders inline visual explanations as you code.

---


## 📄 License

MIT © 2025 — Created by [Leopoldo Todisco](https://github.com/leotodisco)

---

## 🤝 Contributing

Pull requests, suggestions, and contributions are welcome.  
Feel free to open issues to propose ideas or report bugs!
