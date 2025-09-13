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

---

## 📂 Folder Structure

### ✅ Mermaid Diagram (GitHub-compatible, no cycles)
```mermaid
flowchart TD
  ROOT[backend/]

  %% top-level files
  ROOT --> APP[app.js]
  ROOT --> ENV[.env]
  ROOT --> GIT[.gitignore]
  ROOT --> PRETTIER[.prettierrc]
  ROOT --> CONST[constants.js]
  ROOT --> PKG[package.json]
  ROOT --> PKGLOCK[package-lock.json]

  %% src folder as a subgraph
  ROOT --> SRC_NODE[src/]

  subgraph SRC[src/]
    SRC_NODE[src/]

    %% groups inside src
    SRC_NODE --> CTRL[controllers/]
    SRC_NODE --> DBF[db/]
    SRC_NODE --> MIDDLE[middleware/]
    SRC_NODE --> MODS[models/]
    SRC_NODE --> RTS[routes/]
    SRC_NODE --> SRV[services/]
    SRC_NODE --> UTL[utils/]
    SRC_NODE --> VAL[validators/]
    SRC_NODE --> SRCIDX[index.js]

    %% controllers
    subgraph CTRL_SG[controllers/]
      C1[campaigns.controller.js]
      C2[communications.controller.js]
      C3[customer.controller.js]
      C4[delivery.controller.js]
      C5[nl2rules.controller.js]
      C6[order.controller.js]
    end

    %% db
    subgraph DB_SG[db/]
      DBI[index.js]
    end

    %% middleware
    subgraph MID_SG[middleware/]
      M1[protect.js]
      M2[validate.middleware.js]
    end

    %% models
    subgraph MOD_SG[models/]
      Mdl1[campaign.model.js]
      Mdl2[communication_log.model.js]
      Mdl3[customer.model.js]
      Mdl4[order.model.js]
    end

    %% routes
    subgraph ROUTE_SG[routes/]
      R1[ai.routes.js]
      R2[campaigns.route.js]
      R3[communications.routes.js]
      R4[customer.route.js]
      R5[delivery.routes.js]
      R6[nl.routes.js]
      R7[orders.route.js]
    end

    %% services
    subgraph SRV_SG[services/]
      S1[ai.service.js]
      S2[nl2rules.llm.js]
    end

    %% utils
    subgraph UTL_SG[utils/]
      U1[AppError.js]
      U2[asynchandler.js]
      U3[rulesToMongo.js]
      U4[sanitizeSegmentRules.js]
    end

    %% validators
    subgraph VAL_SG[validators/]
      V1[campaign.validator.js]
      V2[communication.validator.js]
      V3[customer.validator.js]
      V4[order.validator.js]
    end
  end
```

### Plain Tree
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
  subgraph CLIENT[Frontend (React/Vite)]
    UI[Campaign UI\nRule Builder + History]
    AUTH[Clerk/Google OAuth\nSession Token]
  end

  subgraph API[Backend (Node/Express)]
    ROUTES[/REST Routes/]
    CTRL[Controllers]
    ZOD[Zod Validators]
    MID[Middleware]
    UTIL[Utils]
  end

  subgraph AI[AI Provider]
    LLM[(OpenAI / Vertex / Local LLM)]
  end

  subgraph DB[(MongoDB)]
    CUST[(customers)]
    ORD[(orders)]
    CAMP[(campaigns)]
    LOG[(communication_log)]
  end

  subgraph VENDOR[Dummy Vendor API]
    SIM[Delivery Simulator\n(90% SENT / 10% FAILED)]
  end

  AUTH -- Bearer token --> MID
  UI -->|create/preview| ROUTES
  ROUTES --> MID --> ZOD --> CTRL
  CTRL --> DB
  CTRL --> LLM
  CTRL --> SIM
  SIM --> ROUTES:::receipt
  classDef receipt stroke-dasharray: 5 5;
  ROUTES --> CTRL --> LOG
```

---

## 🔑 Key Features
- ✅ Customer & Order ingestion APIs (with validation)  
- ✅ Campaign creation with **dynamic rule builder**  
- ✅ Campaign history + delivery stats  
- ✅ Dummy vendor API simulating SENT/FAILED + Delivery Receipt logging  
- ✅ Google OAuth 2.0 authentication (Clerk)  
- ✅ AI-powered **Natural Language → Rules** & **Message Suggestions**   

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
