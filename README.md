


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
VITE_OPENAI_API_KEY=...
VITE_GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
OPENROUTER_API_KEY=...
GROK2_API_KEY=...
IO_API_KEY=...
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

=======
# Agora Marketplace

![agora-picture-bg](https://github.com/user-attachments/assets/225ea16b-22b5-4aef-9eb3-8775f426b3bc)


**Project Overview Analysis**
Glossary:
AI-enhanced tool: any AI powered application, chatbot, image generator, agent, etc. Providers bring these tools to our platform.
* consumer: a user of our platform, uses AI-enhanced tools and pays with $dGPU.
* provider: a user of our platform, provides AI-enhanced tools and earns $dGPU.
* foundational model: a large, pre-trained language model that serves as a versatile base for a wide range of specialized tasks.


**Project Name and Brief Description:** What is the name of your project, and can you give me a concise summary of what it's about?

DanteGPU is an AI agent, chatbot, and application open marketplace powered by the Solana blockchain.

**Primary Business Problem Being Solved:** What specific business pain point, challenge, or opportunity is this project aiming to address?

Currently, AI is controlled by a few major players with vast compute power. Our goal is to democratize access to AI-enhanced platforms and solutions by:
Allowing anyone to publish their AI-enhanced tools on DanteGPU's open marketplace.
Enabling users to access their chosen AI-enhanced tools using a central utility token, $dGPU.

**Key Stakeholders and Their Roles:** Who are the main individuals or groups invested in this project's success, and what are their respective roles (e.g., project sponsor, end-users, department heads)?

This hackathon project, although it did not secure any grants, is still being actively developed by the original team.

**Project Timeline and Constraints:** Do you have an estimated timeline for this project? Are there any known constraints (e.g., budget limitations, specific deadlines, resource availability, technological restrictions)?

We aim to launch the beta marketplace one month after the start, followed by a public release after an additional month of testing. Current challenges include limited expertise in system architecture, designing and maintaining high-traffic websites, and managing a live blockchain product that processes payments and handles sensitive information.

**Expected Business Outcomes and Success Metrics:** What are the tangible business results you expect to achieve with this project, and how will you measure its success (e.g., increased revenue by X%, reduced operational costs by Y%, improved customer satisfaction scores)?

Our key metrics include the number of users on our platform, the number of AI-enhanced apps created, the amount of $dGPU earned by app creators, and the indirect increase in $dGPU’s valuation (MCAP) as customers exchange $dGPU for $SOL and creators are rewarded with $dGPU. Additional metrics may be added as this proposal is refined.

**Target Audiences:**
* For Publishers: Who is your ideal AI tool creator/publisher? (e.g., individual AI hobbyists, small AI dev teams, academic researchers?)
* For End-Users: Who is the primary target end-user of the AI tools on the marketplace? (e.g., businesses, individual consumers, developers integrating these tools into other apps?)
