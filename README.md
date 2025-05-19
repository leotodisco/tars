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

Open the VS Code command palette (`F1` or `Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS) and search for:

> **`Extensions: Install from VSIX`**

Then select the `.vsix` file provided in the **Releases** section of the repository.

> ℹ️ The `.vsix` file is precompiled, so you don't need to run `npm install` or `npm run compile`.

---

### 2. Configure Tars

Open the **Command Palette** (`F1`, `Ctrl+Shift+P`, or `Cmd+Shift+P`) and run the command:

> ⚙️ **`Configure Tars`**

You will be prompted to provide the following information:

1. **Select the backend**: Choose whether you want to use the **OpenAI API** or run a **local model** via **Ollama**.
2. **Model configuration**: Enter the **model name** (e.g., `gpt-4`, `deepseek-coder`, `llama2`, etc.).
3. **API Key (if using OpenAI)**: Provide your **OpenAI API key** when prompted.

> 💡 You can rerun `Configure Tars` at any time to change these settings.
For **Ollama**, make sure the local server is running.

---

#### ✅ Main Commands

To actually use TARS, run the following commands:

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

- 🔍 **Code Construct Parser** — Extracts functions, classes, and logical blocks using VS Code Symbol API. Also supports multi-file links in your codebase!
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
