# Agora Marketplace: Decentralized AI Task Hub

> **Agora Marketplace** is a next-generation decentralized task hub where AI agents meet GPU power and humans delegate tasks in a seamless, pay-as-you-go environment powered by Solana and Supabase.

---

## 📙 Table of Contents

- [1. Overview](#1-overview)
- [2. Key Features](#2-key-features)
- [3. Tech Stack](#3-tech-stack)
- [4. Local Development](#4-local-development)
- [5. Folder Structure](#5-folder-structure)
- [6. Proxy Image Generation](#6-proxy-image-generation)
- [7. Environment Variables](#7-environment-variables)
- [8. Contributing](#8-contributing)
- [9. License](#9-license)

---

## 1. Overview

Agora Marketplace is a modular, intelligent AI agent interface that enables users to:

- Talk to AI agents for image generation or task execution.
- Dynamically choose agents based on their capabilities.
- Interact with a GPU-powered backend.
- View real-time responses including markdown, image previews, and agent-signed outputs.

---

## 2. Key Features

- ✨ **QuickChat UI** for mini-agent interactions
- 🌐 **Full Chat Interface** with message history and retries
- 🏋️ **Supabase Integration** for auth and database
- 🤖 **Dynamic AI Routing** for text and image generation
- 🧡 **Express Proxy Server** to call Hugging Face APIs safely (CORS-free)

---

## 3. Tech Stack

| Layer         | Technology              |
|---------------|--------------------------|
| Frontend      | React + Tailwind         |
| State         | Zustand                  |
| Backend       | Supabase (DB + Auth)     |
| Proxy         | Express + Axios          |
| AI Inference  | Hugging Face API         |
| Blockchain    | Solana (wallet-based ID) |

---

## 4. Local Development

### 4.1 Requirements

- Node.js 18+
- Supabase project (Dev URL + Key)
- Hugging Face API key

### 4.2 Setup

```bash
git clone https://github.com/dante-gpu/agora-marketplace.git
cd agora-marketplace
npm install

# Start Vite frontend
yarn dev

# Start proxy image generation server
node server.js
```

---

## 5. Folder Structure

```
├── server.js            # Express proxy for Hugging Face
├── .env                 # API keys and secrets (ignored)
├── /src
│   ├── /components      # UI components like Card, Button, Chat UI
│   ├── /lib             # Hugging Face client
│   ├── /store           # Zustand state management
│   ├── /pages           # Route views (ChatWindow, etc)
│   └── main.tsx         # React entry
```

---

## 6. Proxy Image Generation

Image prompts are routed through `server.js` to Hugging Face. This:
- Prevents CORS issues
- Hides API key from frontend
- Converts prompt to binary PNG stream

```bash
POST /api/hf-image
Body: { "prompt": "a glowing cyberpunk cat" }
```

---

## 7. Environment Variables

`.env` (in project root):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_HUGGINGFACE_API_KEY=...
```

`.gitignore` already protects this file from being committed.

---

## 8. Contributing

Contributions welcome! Open issues, PRs or feature ideas are all appreciated.

```bash
git checkout -b feature/your-branch
# make changes
git commit -m "feat: describe your feature"
git push origin feature/your-branch
```

---

## 9. License

Agora Marketplace is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 Agora

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

<div align="center">
  <h3>Built by the Agora & DanteGPU Team 🚀</h3>
  <p>
    <a href="https://twitter.com/dantegpu">Twitter</a> •
    <a href="https://agora.market">Website</a> •
    <a href="https://github.com/your-org/agora-marketplace">GitHub</a>
  </p>
</div>

