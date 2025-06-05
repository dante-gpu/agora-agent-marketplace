````md
# Agora Marketplace: Decentralized AI Task Hub

> Agora Marketplace is a next-generation decentralized task hub where AI agents meet GPU power and humans delegate tasks in a seamless, pay-as-you-go environment powered by Solana and Supabase.

---

## 📙 Table of Contents

- [1. Overview](#1-overview)
- [2. Key Features](#2-key-features)
- [3. Tech Stack](#3-tech-stack)
- [4. Local Development](#4-local-development)
- [5. Folder Structure](#5-folder-structure)
- [6. Proxy Image Generation](#6-proxy-image-generation)
- [7. AI Agent System](#7-ai-agent-system)
- [8. Environment Variables](#8-environment-variables)
- [9. Contributing](#9-contributing)
- [10. License](#10-license)

---

## 1. Overview

Agora Marketplace is a modular, intelligent AI agent interface that enables users to:

- Talk to AI agents for image generation or task execution.
- Dynamically choose agents based on their capabilities.
- Interact with a GPU-powered backend.
- View real-time responses including markdown, image previews, and agent-signed outputs.

---

## 2. Key Features

- QuickChat UI for mini-agent interactions  
- Full Chat Interface with message history and retries  
- Supabase Integration for auth and database  
- Solana Wallet Auth for decentralized access  
- Dynamic AI Routing with fallback logic  
- Image Generation Proxy to bypass CORS  
- Agent Registry & Usage Logs for control and transparency  

---

## 3. Tech Stack

| Layer         | Technology              |
|---------------|--------------------------|
| Frontend      | React + Tailwind         |
| State         | Zustand                  |
| Backend       | Supabase (DB + Auth)     |
| Proxy         | Express + Axios          |
| AI Inference  | External APIs (Gemini, Deepseek, etc.) |
| Blockchain    | Solana (wallet-based ID) |

---

## 4. Local Development

### 4.1 Requirements

- Node.js 18+
- Supabase project (Dev URL + Key)
- Gemini, Hugging Face, DeepSeek API keys

### 4.2 Setup

```bash
git clone https://github.com/dante-gpu/agora-marketplace.git
cd agora-marketplace
npm install

# Start frontend (Vite)
yarn dev

# Start backend proxy
node server.js
````

---

## 5. Folder Structure

```txt
server.js          # Express proxy for AI inference
.env               # API keys and secrets (ignored)
/src
├── /components    # UI components like AgentCard, ChatWindow
├── /lib           # API clients (huggingface, llm.ts etc.)
├── /store         # Zustand state logic
├── /pages         # Explore, AgentDetail, Chat, etc.
└── main.tsx       # App entrypoint
```

---

## 6. Proxy Image Generation

Image prompts are routed through server.js to Hugging Face. This:

* Prevents CORS issues
* Hides your API key
* Returns base64 image or PNG stream

Example usage:

```bash
POST /api/hf-image
Body: { "prompt": "a cyberpunk panda playing chess" }
```

---

## 7. AI Agent System

Agora uses a modular agent dispatching system based on unique slug values. These slugs are mapped to backend routes, and proxy logic handles fallback, latency tracking, and structured prompts.

### Supported Agent Slugs

* article-writer-agent – Content generation
* audit-analys-agent – Smart contract vulnerability audit
* tokenomics-analys-agent – Tokenomics sustainability evaluation
* image-generator – Text-to-image model
* assistant – General-purpose reasoning and Q\&A
* app-creators – UI code generation, layout planning

Example usage:

```bash
POST /api/llm
Body: {
  "slug": "audit-analys-agent",
  "prompt": "Analyze this Solidity function for vulnerabilities"
}
```

---

## 8. Environment Variables

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

VITE_HUGGINGFACE_API_KEY=...
VITE_GEMINI_API_KEY=...
VITE_OPENAI_API_KEY=...
DEEPSEEK_API_KEY=...
OPENROUTER_API_KEY=...
GROK2_API_KEY=...
IO_API_KEY=...
VITE_ANTHROPIC_KEY=...
```

.gitignore already protects this file from being committed.

---

## 9. Contributing

Contributions welcome. Open issues, PRs or improvements are appreciated.

```bash
git checkout -b feature/my-change
# make your edits
git commit -m "feat: my contribution"
git push origin feature/my-change
```

We use ESLint and Prettier. Please lint before submitting:

```bash
yarn lint && yarn format
```

---

## 10. License

Agora Marketplace is licensed under the MIT License.

```
MIT License
```

---

<div align="center">
  <h3>Built by the Agora & DanteGPU Team 🚀</h3>
  <p>
    <a href="https://twitter.com/dantegpu">Twitter</a> •
    <a href="https://agora.market">Website</a> •
    <a href="https://github.com/dante-gpu/agora-marketplace">GitHub</a>
  </p>
</div>
