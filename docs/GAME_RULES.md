# SolJack Game Rules

Standard casino blackjack with PvP modifications.

---

## Overview

- Pure PvP - One player is Dealer, one is Player
- No splits, doubles, or insurance (v1)
- Single 52-card deck (reshuffled when exhausted)
- 60-second turn timer with auto-stand fallback
- Provably fair commit-reveal shuffling

---

## Card Values

| Card | Value |
|---|---|
| 2-9 | Face value |
| 10, J, Q, K | 10 |
| Ace | 1 or 11 |

---

## Turn Order

1. Player acts first (hit/stand)
2. Dealer acts second (must hit until 17, stand on soft 17)
3. Settle hand and distribute payouts

---

## Payouts

- Win: 1:1 payout
- Loss: Lose bet
- Push: Full refund (bet + fee)

---

## Auto-Actions on Timeout

- Player: Auto-stand
- Dealer: Auto-hit if < 17, auto-stand if ≥ 17

---

For complete game rules, see the full GAME_RULES.md in /docs.