# NexPlay Bot Admin Panel

Owner-only web dashboard for managing the NexPlay Tournament System SaaS.

## Features
- 📊 Dashboard — live stats, MRR, server count
- 🖥️ Servers — manage all client servers, assign plans, ban/unban
- 📋 Plans — create and edit subscription plans
- 🎟️ Promo Codes — generate and manage discount codes
- 🎁 Offers — time-limited promotions
- 💰 Revenue — MRR breakdown and subscription table
- 🔔 Notifications — admin alerts with mark-as-read

## Access
This panel is **strictly private** — for the bot owner (Unish) and authorized staff only.
External server owners manage tournaments exclusively via Discord slash commands.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- React Query
- Base44 Entity API

## Development
```bash
npm install
npm run dev
```

## Environment
The panel reads from the Base44 platform API automatically — no additional env vars needed.
