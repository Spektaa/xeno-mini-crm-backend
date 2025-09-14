# 📖 Mini CRM Platform – Backend (Xeno SDE Internship 2025)

This is the backend of the **Mini CRM Platform** built for the **Xeno SDE Internship Assignment 2025**. It powers customer & order ingestion, audience segmentation, campaign creation & delivery, and AI-assisted features (NL → rules, message suggestions).

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (Express)
* **DB:** MongoDB + Mongoose
* **Validation:** Zod
* **Auth:** Clerk (Google OAuth 2.0)
* **AI:** OpenAI API (optional features)
* **Utilities:** Multer (CSV upload), Custom error & async handlers

---

## 📂 Folder Structure ### ✅ Mermaid Diagram (GitHub‑compatible)
mermaid
flowchart TD
  ROOT[backend/]
  ROOT --> APP[app.js]
  ROOT --> ENV[.env]
  ROOT --> GIT[.gitignore]
  ROOT --> PRETTIER[.prettierignore]
  ROOT --> PRC[.prettierrc]
  ROOT --> CONST[constants.js]
  ROOT --> PKG[package.json]
  ROOT --> PKGLOCK[package-lock.json]
  ROOT --> SRC[src/]

  subgraph SRC_SG[src/]
    SRCIDX[index.js]
    CTRL[controllers/]
    DBF[db/]
    MIDDLE[middleware/]
    MODS[models/]
    RTS[routes/]
    SRV[services/]
    UTL[utils/]
    VAL[validators/]
  end

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
### Plain Tree
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
---

## 🚀 Local Setup

```bash
# 1) Install deps
npm install

# 2) Configure environment
cp .env.example .env   # (create if example not present)

# 3) Run dev server
npm run dev
```

### 🔐 Required ENV Vars

```
MONGO_URI=...
CLERK_SECRET_KEY=...
OPENAI_API_KEY=...
PORT=8000
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

---

## ✅ Key Features

* Customer & Order ingestion (single + bulk CSV)
* Dynamic audience rules & preview
* Campaign lifecycle (create, list, update, status, delete)
* Delivery logging + vendor callback (webhook)
* AI helpers: NL → rules, message suggestions

---

## 🔑 Authentication

Most routes are protected with Clerk. Send **`Authorization: Bearer <token>`**.

* Public/unauthenticated: **Delivery Receipt Webhook** (can be secured via shared secret header if desired)

---

## 🔗 API Routes (Methods Only)

> **Base Path:** `/api/v1`

### 1) Customers (`/customers`)

* `POST /customers` – create
* `GET /customers` – list
* `GET /customers/:id` – read
* `PATCH /customers/:id` – update
* `DELETE /customers/:id` – delete
* `POST /customers/bulk` – bulk CSV upload

### 2) Customer Search (`/customer-search`)

* `GET /customer-search/search?q=` – typeahead by email/name

### 3) Orders (`/orders`)

* `POST /orders` – create (amount auto-computed in model)
* `POST /orders/bulk` – bulk CSV upload
* `GET /orders` – list
* `GET /orders/:id` – read
* `PATCH /orders/:id` – update
* `DELETE /orders/:id` – delete
* `GET /orders/by-customer/:customerId` – list by customer

### 4) Campaigns (`/campaigns`)

* `POST /campaigns` – create (auth → attachCreator → validate)
* `GET /campaigns` – list (most recent first)
* `GET /campaigns/:id` – read
* `PATCH /campaigns/:id` – update
* `PATCH /campaigns/:id/status` – change status (e.g., paused/active)
* `DELETE /campaigns/:id` – delete
* `POST /campaigns/preview` – audience preview from `segmentRules`

### 5) Communications (`/communications`)

* `POST /communications` – create log entry
* `GET /communications` – list (supports `page`, `limit`, `campaign`, `customer`, `status`)
* `GET /communications/:id` – read
* `PATCH /communications/:id` – update (partial)
* `DELETE /communications/:id` – delete

### 6) Delivery (`/delivery`)

* `GET /delivery/campaign/:id/logs` – logs for a campaign (populated, sorted `createdAt:-1`)
* `POST /delivery/receipt` – delivery receipt webhook (from vendor simulator)

### 7) Natural Language (`/nl`)

* `POST /nl/segment-rules/parse` – NL → rules

### 8) AI (`/ai`)

* `POST /ai/message-ideas` – generate message suggestions

---

## 🧪 NPM Scripts

* `dev` – start in watch mode (nodemon)
* `start` – production start
* `lint` – run linter (if configured)

---

## ⚠️ Notes / Assumptions

* Clerk session tokens are short‑lived (refresh in API tools as needed)
* Delivery endpoint is intentionally webhook‑friendly (consider shared secret)
* AI outputs are non‑deterministic

---

## 📦 Deployment Tips

* Set env vars in hosting provider (Render/Railway/Heroku/etc.)
* This one is deployed on Render 
* Configure CORS to include your frontend origin(s)
---

**Made with ♥ for the Xeno SDE Internship 2025.**
