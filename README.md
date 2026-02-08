# SolJack

**PvP Blackjack on Solana**

Pure peer-to-peer blackjack. No house. Choose Dealer or Player. Bet SOL. Compete for rewards.

Live at: **https://soljack.online**

---

## 🎯 Overview

- **Pure PvP:** User vs User (platform never plays)
- **Provably Fair:** Commit-reveal deck shuffling
- **Instant Payouts:** On-chain escrow via Solana
- **Competitive:** First username to 100 wins gets Pump.Fun creator rewards

---

## 🛠 Tech Stack

**Frontend:**
- React + Vite + TypeScript
- Phantom Wallet integration
- Cinque Terre-inspired UI

**Backend:**
- Node.js + TypeScript + Fastify
- WebSocket (ws)
- Helius RPC
- Redis caching (optional)

**Smart Contracts:**
- Anchor framework (Rust)
- Username Registry Program
- Game Program (commit-reveal RNG)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- Rust + Anchor CLI
- Solana CLI
- Phantom Wallet

### 1. Clone & Install
```bash
git clone <repo>
cd soljack
npm install
```

### 2. Environment Setup
Copy `.env.example` files:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Update with your:
- Helius RPC URL
- Deployed program IDs
- WebSocket ports

### 3. Smart Contract Deployment
```bash
cd programs
anchor build
anchor deploy
```
Copy program IDs to `.env` files.

### 4. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment

**Frontend:** Vercel / Netlify (static hosting)
**Backend:** Railway / Render (Node.js)
**Domain:** soljack.online

---

## 🎮 How It Works

1. Connect Phantom wallet
2. Optionally mint username ($1 SOL)
3. Select bet tier (0.01 - 1 SOL)
4. Create or join table (choose Dealer or Player)
5. Provably fair deck shuffle (commit-reveal)
6. Play standard blackjack
7. Instant on-chain payout

**Protocol fee:** 0.001 SOL per player (refunded on push)

---

## 🏆 100-Win Race

First **claimed username** to reach 100 wins receives Pump.Fun token creator rewards.

Winner displayed permanently at top of site.

---

## 📁 Project Structure
```
soljack/
├── frontend/          # React app
├── backend/           # Node.js API + WebSocket
├── programs/          # Anchor smart contracts
│   ├── username/      # Username registry
│   └── game/          # SolJack game logic
├── docs/              # Documentation
├── README.md
└── LICENSE
```

---

## 📚 Documentation

- [Smart Contracts](docs/SMART_CONTRACTS.md) - Program architecture and specs
- [API & WebSocket](docs/API.md) - Backend endpoints and events
- [Game Rules](docs/GAME_RULES.md) - Blackjack implementation details
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment steps

---

## 🔧 Troubleshooting

**Wallet won't connect:**
- Ensure Phantom is installed
- Check network is Mainnet

**Transaction fails:**
- Verify sufficient SOL balance (bet + 0.001 fee)
- Check Helius RPC status

**WebSocket disconnects:**
- Backend server must be running
- Check VITE_WS_URL in frontend .env

---

## 📄 License

Apache 2.0 - See [LICENSE](LICENSE) file for details

---

## 🌐 Links

**Website:** https://soljack.online

---

**Not financial advice. For entertainment purposes only.**