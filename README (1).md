# 📖 Mini CRM Platform – Xeno SDE Internship Assignment 2025

This is a **Mini CRM Platform** built as part of the **Xeno SDE Internship Assignment 2025**.  
It enables customer segmentation, campaign creation & delivery, and integrates AI features like **Natural Language → Segment Rules** & **AI-driven message suggestions**.

---

## 🛠️ Tech Stack
- **Frontend:** React (Vite, TailwindCSS, Clerk for Auth)  
- **Backend:** Node.js (Express, MongoDB, Zod Validators, Mongoose ODM)  
- **Database:** MongoDB (customers, orders, campaigns, communication_log)  
- **Auth:** Google OAuth 2.0 via Clerk  
- **AI:** OpenAI API for NL→rules & message suggestions  
- **Optional Infra:** Kafka / RabbitMQ / Redis Streams for pub-sub  

---

## 📂 Folder Structure

### Diagram
```mermaid
flowchart TD
    A[backend] --> B[src]
    A --> Z1[app.js]
    A --> Z2[.env]
    A --> Z3[.gitignore]
    A --> Z4[.prettierrc]
    A --> Z5[constants.js]
    A --> Z6[package.json]

    subgraph B[src]
      B --> C[controllers]
      B --> D[db]
      B --> E[middleware]
      B --> F[models]
      B --> G[routes]
      B --> H[services]
      B --> I[utils]
      B --> J[validators]
      B --> K[index.js]
    end
```

### Tree
```
backend/
├─ app.js
├─ .env
├─ .gitignore
├─ .prettierignore
├─ .prettierrc
├─ constants.js
├─ package.json
├─ package-lock.json
└─ src/
   ├─ index.js
   ├─ controllers/
   │  ├─ campaigns.controller.js
   │  ├─ communications.controller.js
   │  ├─ customer.controller.js
   │  ├─ delivery.controller.js
   │  ├─ nl2rules.controller.js
   │  └─ order.controller.js
   ├─ db/
   │  └─ index.js
   ├─ middleware/
   │  ├─ protect.js
   │  └─ validate.middleware.js
   ├─ models/
   │  ├─ campaign.model.js
   │  ├─ communication_log.model.js
   │  ├─ customer.model.js
   │  └─ order.model.js
   ├─ routes/
   │  ├─ ai.routes.js
   │  ├─ campaigns.route.js
   │  ├─ communications.routes.js
   │  ├─ customer.route.js
   │  ├─ delivery.routes.js
   │  ├─ nl.routes.js
   │  └─ orders.route.js
   ├─ services/
   │  ├─ ai.service.js
   │  └─ nl2rules.llm.js
   ├─ utils/
   │  ├─ AppError.js
   │  ├─ asynchandler.js
   │  ├─ rulesToMongo.js
   │  └─ sanitizeSegmentRules.js
   └─ validators/
      ├─ campaign.validator.js
      ├─ communication.validator.js
      ├─ customer.validator.js
      └─ order.validator.js
```

---

## 🏗️ System Architecture
```mermaid
flowchart LR
    subgraph Client[Frontend (React/Vite)]
      UI[Campaign UI\nRule Builder + History]
      AuthC[Clerk/Google OAuth\nSession Token]
    end

    subgraph API[Backend (Node/Express)]
      Routes[/REST Routes/]
      Ctrl[Controllers]
      Vald[Zod Validators]
      MW[Middleware]
      Util[Utils]
    end

    subgraph AI[AI Provider]
      LLM[(OpenAI / Vertex / Local LLM)]
    end

    subgraph DB[(MongoDB)]
      Coll1[(customers)]
      Coll2[(orders)]
      Coll3[(campaigns)]
      Coll4[(communication_log)]
    end

    subgraph Vendor[Dummy Vendor API]
      Sim[Delivery Simulator\n(90% SENT / 10% FAILED)]
    end

    AuthC -- Bearer token --> MW
    UI -->|create/preview| Routes
    Routes --> MW --> Vald --> Ctrl
    Ctrl --> DB
    Ctrl --> AI
    Ctrl --> Sim
    Sim --> Routes: Delivery Receipt
    Routes --> Ctrl --> DB
```

---

## 🔑 Key Features
- ✅ Customer & Order ingestion APIs (with validation)  
- ✅ Campaign creation with **dynamic rule builder**  
- ✅ Campaign history + delivery stats  
- ✅ Dummy vendor API simulating SENT/FAILED + Delivery Receipt logging  
- ✅ Google OAuth 2.0 authentication (Clerk)  
- ✅ AI-powered **Natural Language → Rules** & **Message Suggestions**  
- 🔄 Optional **Pub/Sub** pipeline for ingestion + delivery receipt batching  

---

## 🚀 Running Locally
```bash
# 1. Clone repo
git clone https://github.com/<your-repo>.git
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
MONGO_URI=mongodb+srv://...
CLERK_SECRET_KEY=...
OPENAI_API_KEY=...

# 4. Start dev server
npm run dev
```

---

## ⚠️ Limitations & Assumptions
- Clerk session tokens are **short-lived** → may need refreshing in Postman.  
- Vendor API is a **mock simulator** (not real SMS/email).  
- AI outputs are **non-deterministic** (results vary).  
- Pub/Sub is **optional** and mocked in local setup.  

---

