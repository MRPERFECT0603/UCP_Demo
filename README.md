# UCP Shopping Agent

A conversational AI shopping agent that demonstrates the **Universal Commerce Protocol (UCP)** — an open protocol for AI agents to interact with merchant servers for product discovery, cart management, and checkout without scraping web pages.

Built as a demo showing how AI agents can perform end-to-end commerce through structured APIs instead of traditional web interfaces.

---

## What it does

Type natural language in the chat interface and the agent:

1. **Discovers** Flipkart and Myntra merchant servers via `GET /.well-known/ucp`
2. **Searches** both catalogs simultaneously and returns ranked results
3. **Creates** checkout sessions on your chosen merchant
4. **Updates** cart (quantity, coupons)
5. **Initiates and verifies** payment (Card / UPI / COD) via UCP payment endpoints
6. **Confirms** the order and shows a receipt

```
User: "Find black Nike shoes under ₹5000"
  → Agent discovers Flipkart + Myntra via UCP
  → Searches both catalogs in parallel
  → Shows product carousel with real images

User: "Buy the cheapest one"
  → Creates UCP checkout session on Flipkart
  → Shows cart summary with price breakdown

User: "Apply coupon SAVE10"
  → Updates checkout session with coupon

User: "Proceed to payment"
  → Inits UCP payment, opens payment modal
  → User selects Card / UPI / Google Pay / COD
  → Verifies payment with merchant, confirms order
```

---

## Architecture

```
┌─────────────────────────────────┐
│        React Chat UI            │  localhost:5173
│  (Vite + TailwindCSS + shadcn)  │
└────────────────┬────────────────┘
                 │ POST /chat
                 ▼
┌─────────────────────────────────┐
│      AI Shopping Agent API      │  localhost:4000
│         (Express + TypeScript)  │
│                                 │
│  ┌─────────────┐ ┌───────────┐  │
│  │ Groq LLM    │ │Commerce   │  │
│  │ (Intent NLU)│ │Orchestrat.│  │
│  └─────────────┘ └───────────┘  │
│  ┌─────────────────────────────┐ │
│  │    Conversation Manager     │ │
│  │     (in-memory state)       │ │
│  └─────────────────────────────┘ │
└────────┬────────────────┬────────┘
         │                │
         ▼                ▼
┌────────────────┐ ┌────────────────┐
│ Flipkart Mock  │ │  Myntra Mock   │
│   UCP Server   │ │   UCP Server   │
│  localhost:3001│ │ localhost:3002 │
└────────────────┘ └────────────────┘
```

### Key design principle

The LLM (Groq / Llama 3.3) **only does Natural Language Understanding** — it extracts structured intents from user messages. All commerce decisions (which API to call, how checkout works, payment flow) are handled by deterministic TypeScript code in the orchestrator.

---

## Project structure

```
talkDemo/
├── backend/                    # Express API (port 4000)
│   └── src/
│       ├── server.ts           # Entry point
│       ├── app.ts              # Express app + routes
│       ├── config/
│       │   └── merchants.ts    # Registered merchant URLs
│       ├── llm/
│       │   ├── openai.ts       # Groq API call (intent extraction)
│       │   ├── prompt.ts       # System prompt + user prompt builder
│       │   └── parser.ts       # JSON intent parser
│       ├── services/
│       │   ├── discovery.service.ts   # GET /.well-known/ucp
│       │   ├── catalog.service.ts     # Search products
│       │   ├── checkout.service.ts    # Create/update/pay checkout
│       │   └── merchant.service.ts    # Merchant cache + refresh
│       ├── orchestrator/
│       │   └── commerce.orchestrator.ts  # Core business logic
│       ├── conversation/
│       │   └── conversation.manager.ts   # Per-session state
│       ├── controllers/
│       │   └── chat.controller.ts
│       ├── routes/
│       │   └── chat.routes.ts
│       └── types/
│           └── index.ts        # All shared TypeScript types
│
├── frontend/                   # React app (port 5173)
│   └── src/
│       ├── App.tsx
│       ├── hooks/
│       │   └── useChat.ts      # Chat state + API calls
│       ├── services/
│       │   └── api.ts          # fetch wrappers
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── MessageList.tsx
│       │   ├── ChatInput.tsx
│       │   ├── ProductCard.tsx          # Carousel card
│       │   ├── ProductDetailModal.tsx   # Full-screen product popup
│       │   ├── CartSummary.tsx
│       │   ├── OrderConfirmationCard.tsx
│       │   └── PaymentModal.tsx         # Card / UPI / COD payment UI
│       └── types/
│           └── index.ts
│
├── mock-servers/
│   ├── flipkart/src/index.ts   # Flipkart UCP server (port 3001)
│   └── myntra/src/index.ts     # Myntra UCP server (port 3002)
│
├── start.bat                   # One-click start (Windows)
└── start.sh                    # One-click start (Mac/Linux)
```

---

## UCP Endpoints

Each merchant exposes the following UCP-compliant endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/.well-known/ucp` | GET | Capability discovery |
| `/ucp/catalog/search` | GET | Search products with filters |
| `/ucp/checkout` | POST | Create checkout session |
| `/ucp/checkout/:id` | PUT | Update qty or apply coupon |
| `/ucp/checkout/:id/payment/init` | POST | Get payment token + methods |
| `/ucp/checkout/:id/payment/verify` | POST | Verify payment, confirm order |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Groq API key](https://console.groq.com) (free tier available)

### 1. Clone and configure

```bash
git clone https://github.com/MRPERFECT0603/talkDemo.git
cd talkDemo

# Add your Groq API key
cp backend/.env.example backend/.env
# Edit backend/.env and set GROQ_API_KEY=your_key_here
```

### 2. Start everything

**Windows:**
```bat
start.bat
```

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

This installs dependencies (first run only) and opens 4 terminal windows:
- Flipkart UCP Server → `http://localhost:3001`
- Myntra UCP Server → `http://localhost:3002`
- Backend API → `http://localhost:4000`
- Frontend → `http://localhost:5173`

### 3. Open the app

Navigate to **[http://localhost:5173](http://localhost:5173)** and start chatting.

---

## Example queries

```
Find black Nike shoes under ₹5000
Show me Adidas running shoes
Find the cheapest shoes available
Buy the second one
Buy the Myntra option
Increase quantity to 2
Apply coupon SAVE10
Proceed to payment
Track my order
```

### Valid coupons

| Code | Merchant | Discount |
|---|---|---|
| `SAVE10` | Both | 10% off |
| `FLAT200` | Flipkart | ₹200 flat |
| `MYNTRA20` | Myntra | 20% off |

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript, tsx |
| LLM | Groq API (Llama 3.3 70B Versatile) |
| HTTP client | Axios |
| Mock servers | Express + TypeScript |

---

## How the LLM is used

The LLM receives a strict system prompt instructing it to **only extract intent** — never make commerce decisions. It returns structured JSON:

```json
{ "intent": "SEARCH_PRODUCTS", "filters": { "query": "Nike shoes", "color": "black", "maxPrice": 5000 } }
{ "intent": "CREATE_CHECKOUT", "merchantPreference": "Myntra" }
{ "intent": "CHANGE_QUANTITY", "quantity": 2 }
{ "intent": "APPLY_COUPON", "couponCode": "SAVE10" }
{ "intent": "COMPLETE_CHECKOUT" }
```

The orchestrator handles everything else deterministically.

---

## Adding a new merchant

1. Create a new mock server in `mock-servers/<merchant>/` following the existing pattern
2. Add the merchant to `backend/src/config/merchants.ts`:
   ```ts
   { name: 'Amazon', baseUrl: 'http://localhost:3003' }
   ```
3. The agent will automatically discover it via UCP — no other code changes needed

---

## License

MIT
