Technical Roadmap: AI Chatbot, User Tiers, and Billing
Architecture Overview

┌─────────────────────────────────────────────────────────────────┐
│                         User Tiers                              │
├─────────────┬─────────────────────┬─────────────────────────────┤
│   Public    │   Paid (Registered) │         Admin               │
├─────────────┼─────────────────────┼─────────────────────────────┤
│ • View map  │ • View map          │ • Full CRUD                 │
│ • No desc   │ • With descriptions │ • Publish state             │
│ • No chat   │ • AI chatbot        │ • Analytics                 │
│ • Cached    │ • Saved filters(?)  │ • AI chatbot                │
└─────────────┴──────────┬──────────┴─────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌────────────┐    ┌──────────┐
   │ Stripe  │    │  Firebase  │    │ Firebase │
   │Checkout │───▶│   Auth     │───▶│Firestore │
   └─────────┘    └────────────┘    │Permissions│
                                    └──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Firebase Functions │
              │  (2nd Gen)          │
              │  • AI Chat endpoint │
              │  • Stripe webhooks  │
              └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Vercel AI SDK      │
              │  + Claude/GPT       │
              └─────────────────────┘

Phase 1: User Tiers & Permissions Infrastructure

Goal: Establish 3-tier user system before adding features that depend on it.

1.1 Extend Permissions Schema

// src/types.ts - new Permission type
interface Permission {
  isAdmin: boolean
  isPaid: boolean              // NEW: has active subscription
  countryCodes: string[]
  stripeCustomerId?: string    // NEW: for Stripe integration
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  createdAt: Timestamp
}

1.2 Create 3 State Files
File	Audience	Contents
publicState.json	Public	Incidents without descriptions
state.json	Paid users	Incidents with descriptions
adminCheckpointState.json	Admins	Full data + timestamps

1.3 Modify Data Fetching (src/utils.ts, src/context/DBContext.tsx)

    Check isPaid from Permissions collection
    Route to appropriate state file
    Update loadDB() to handle 3 tiers

1.4 Update Firestore Rules

// firestore.rules
match /Incidents/{incidentId} {
  allow read: if request.auth != null && 
              getUserPermissions(request.auth.uid).isPaid;
}

Files to modify:

    src/types.ts
    src/utils.ts
    src/context/DBContext.tsx
    firestore.rules
    src/pages/PublishAdmin.tsx (generate 3 state files)

Phase 2: Stripe Billing Integration

Goal: Self-service signup with Stripe Checkout gating paid access.

2.1 New Dependencies

pnpm add stripe @stripe/stripe-js
pnpm add -D @types/stripe

2.2 Firebase Functions Setup

cd functions
npm init -y
npm install firebase-functions firebase-admin stripe

2.3 Stripe Webhook Handler (Firebase Function)

// functions/src/stripe.ts
export const stripeWebhook = onRequest(async (req, res) => {
  const event = stripe.webhooks.constructEvent(...)
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Create Firebase user if needed
      // Set isPaid: true in Permissions
      break
    case 'customer.subscription.deleted':
      // Set isPaid: false
      break
  }
})

2.4 Checkout Flow

    User clicks "Subscribe" → redirect to Stripe Checkout
    Stripe collects payment + creates customer
    Webhook fires → Firebase Function creates/updates Permission doc
    User redirected back → Firebase Auth signs them in
    App reads isPaid: true → grants access

2.5 New Components

    src/pages/Pricing.tsx - pricing page with Stripe button
    src/components/PaywallGate.tsx - wrap paid features

Files to create:

    functions/ directory (Firebase Functions)
    functions/src/stripe.ts
    src/pages/Pricing.tsx
    src/components/PaywallGate.tsx

Files to modify:

    src/App.tsx (new routes)
    firebase.json (functions config)

Phase 3: AI Chatbot

Goal: Natural language filter construction + data Q&A + graph generation.

3.1 Dependencies

pnpm add ai @ai-sdk/anthropic  # or @ai-sdk/openai

For Firebase Functions:

cd functions
npm install ai @ai-sdk/anthropic

3.2 AI Tools Schema

The chatbot needs tools that mirror your filter system. Based on src/filters/filterReducer.ts:

// functions/src/ai/tools.ts
const tools = {
  constructFilter: {
    description: 'Build a filter to show/hide incidents on the map',
    parameters: z.object({
      type: z.enum(['category', 'country', 'date', 'desc', 'latlong', 'not', 'or']),
      state: z.any() // Varies by filter type
    })
  },
  
  queryIncidents: {
    description: 'Answer questions about incident data',
    parameters: z.object({
      question: z.string(),
      filters: z.array(filterSchema).optional()
    })
  },
  
  generateGraph: {
    description: 'Create a visualization of incident data',
    parameters: z.object({
      type: z.enum(['line', 'pie', 'bar']),
      metric: z.enum(['count', 'byCategory', 'byCountry', 'byDate']),
      filters: z.array(filterSchema).optional()
    })
  }
}

3.3 Firebase Function Endpoint

// functions/src/ai/chat.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export const chatEndpoint = onRequest(async (req, res) => {
  // Verify user is paid via Firebase Auth token
  const user = await verifyAuth(req)
  if (!user.isPaid) return res.status(403).send('Subscription required')
  
  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You help users explore crime incident data in South America...`,
    messages: req.body.messages,
    tools
  })
  
  // Stream response back
  result.pipeTextStreamToResponse(res)
})

3.4 Frontend Chat Component

// src/components/ChatBot.tsx
import { useChat } from 'ai/react'

function ChatBot() {
  const { messages, input, handleSubmit } = useChat({
    api: '/api/chat', // Firebase Function URL
  })
  
  // Handle tool calls to update filters
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.toolInvocations) {
        msg.toolInvocations.forEach(tool => {
          if (tool.toolName === 'constructFilter') {
            dispatch({ type: 'ADD_FILTER', filter: tool.result })
          }
        })
      }
    })
  }, [messages])
}

3.5 Graph Generation

When the AI calls generateGraph, the frontend receives props to render:

// Tool result from AI
{
  type: 'line',
  metric: 'byDate',
  data: [...], // AI queries data and returns
  title: 'Incidents Over Time in Colombia'
}

// Frontend renders
<LineGraph {...toolResult} />

Files to create:

    functions/src/ai/chat.ts
    functions/src/ai/tools.ts
    functions/src/ai/systemPrompt.ts
    src/components/ChatBot.tsx
    src/components/ChatMessage.tsx
    src/hooks/useChat.ts (if customizing beyond ai/react)

Files to modify:

    src/App.tsx (add chat UI)
    src/pages/Map.tsx (integrate chat panel)
    src/filters/filterReducer.ts (may need BATCH_ADD_FILTERS action)

Phase 4: Integration & Polish

4.1 Chat-to-Filter UX

    Chat suggests a filter → user confirms → filter applied
    Show preview of what the filter will do before applying
    "Undo" capability for AI-applied filters

4.2 Persisted Conversations

    Store chat history in Firestore per user
    Resume conversations across sessions

4.3 Rate Limiting

// functions/src/middleware/rateLimit.ts
// Limit paid users to X messages/day to control costs

4.4 Cost Monitoring

    Log token usage per user
    Dashboard for admin to monitor AI costs
    Alert if approaching budget threshold

Key Files Summary
File	Changes
src/types.ts	Add Permission.isPaid, chat types
src/filters/filterReducer.ts	Already well-structured for AI
src/context/DBContext.tsx	3-tier data loading
src/utils.ts	New state file logic
firestore.rules	Paid user read access
functions/src/stripe.ts	Webhook handler
functions/src/ai/chat.ts	Chat endpoint
src/components/ChatBot.tsx	Chat UI
src/pages/Pricing.tsx	Stripe checkout
Dependencies to Add

Frontend:

{
  "ai": "^3.x",
  "@ai-sdk/anthropic": "^0.x",
  "@stripe/stripe-js": "^2.x"
}

Functions:

{
  "firebase-functions": "^4.x",
  "firebase-admin": "^11.x", 
  "stripe": "^14.x",
  "ai": "^3.x",
  "@ai-sdk/anthropic": "^0.x"
}
