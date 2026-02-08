# SolJack Deployment Guide

Production deployment to Solana Mainnet + hosting.

---

## Prerequisites

- Node.js 18+
- Rust + Anchor CLI
- Solana CLI
- Helius account
- Vercel/Netlify account
- Railway/Render account

---

## Deployment Steps

1. Smart Contracts
   - Build with anchor build
   - Deploy with anchor deploy --provider.cluster mainnet
   - Copy program IDs to .env files

2. Backend
   - Configure .env with RPC URL and program IDs
   - Deploy to Railway/Render
   - Get WebSocket URL

3. Frontend
   - Configure .env.production with backend URL
   - Build with npm run build
   - Deploy to Vercel/Netlify

4. Domain
   - Configure DNS for soljack.online
   - Point to Vercel

---

For complete deployment guide with commands, see the full DEPLOYMENT.md in /docs.