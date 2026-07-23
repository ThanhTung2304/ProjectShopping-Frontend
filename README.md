# 🎨 LEANH Studio — Frontend

Customer and admin interface for the **LEANH Studio** fashion e-commerce platform, built with React + Vite. Includes a full shopping experience plus an **AI shopping assistant** embedded directly in the UI.

## 📌 Features

- ✅ **Home, product listing & product details** — filter by category, price range, size, color
- ✅ **Cart & Checkout** — VNPay integration, real-time order status tracking
- ✅ **User authentication** — email register/login, Google OAuth, OTP-based password reset
- ✅ **Admin dashboard** — manage products, variants, images, orders, users, categories, coupons
- ✅ **AI Shopping Assistant** — floating chat widget, customer-facing only
- ✅ **Automatic JWT refresh** — axios interceptor auto-renews expired tokens, queues concurrent requests to avoid duplicate refresh calls
- ✅ **Single Page Application** — client-side routing with rewrite rules for correct page reloads in production
- ✅ **Responsive design** — optimized for mobile, including the chatbot widget

## 📁 Project Structure

```
fashionshop-FE
├── api/                      # API call functions
│   ├── axiosClient.js        # Axios setup, JWT + refresh token interceptor
│   ├── productApi.js
│   ├── cartApi.js
│   ├── orderApi.js
│   ├── chatApi.js            # Chatbot API calls
│   └── ...
├── components/
│   ├── client/                # Customer-facing components
│   ├── admin/                  # Admin dashboard components
│   └── ChatWidget/              # AI shopping assistant widget
├── pages/                      # Route-level pages
├── router/                     # Route configuration, route guards (GuardRoute, AdminRoute)
├── hooks/                       # Custom hooks (useCart, etc.)
├── utils/                       # Utility functions (currency formatting, product helpers, etc.)
└── App.jsx                      # Root component, route declarations
```

## 🧠 Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Framework & build tool |
| React Router DOM | Navigation, customer/admin route separation |
| Axios | API calls, JWT & refresh token interceptor |
| CSS Modules | Component-scoped styling, no class name collisions |
| Vercel | Production hosting |

## 🤖 AI Shopping Assistant

A floating chat widget in the bottom-right corner, automatically **hidden on admin routes** (`/admin/**`) and shown only on the customer-facing site.

- 💬 Sends conversation history with every request, so the bot answers with the correct context and avoids repeating itself
- 💾 Chat history is persisted in `localStorage` — survives page reloads, with a manual "clear history" button
- 🔗 Product suggestion links are only shown when the customer's intent clearly signals they want to see products, keeping the UI clean for casual messages
- 📱 Responsive — switches to full-screen on mobile (≤480px)
- 🐛 Detailed error logging to the console (status code, backend message) for fast debugging, while still showing a friendly message to the user


### Deploying to Vercel

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL` → production backend domain |



All API calls go through `axiosClient.js`:
- Automatically attaches the JWT to the `Authorization` header from `sessionStorage`
- Automatically refreshes the token on `401` errors, queuing concurrent requests to avoid triggering multiple refresh calls
- Make sure the frontend domain is added to the backend's CORS configuration (`CorsConfig.java`, `FRONTEND_URL` variable) whenever deploying to a new domain
