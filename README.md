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

## 📂 Folder Structure (Backend)

```
backend/
├─ app.js
├─ .env
├─ .gitignore
├─ .prettierignore
├─ .prettierrc
├─ constants.js
├─ package.json
└─ src/
   ├─ index.js
   ├─ controllers/
   ├─ db/
   ├─ middleware/
   ├─ models/
   ├─ routes/
   ├─ services/
   ├─ utils/
   └─ validators/
```

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
