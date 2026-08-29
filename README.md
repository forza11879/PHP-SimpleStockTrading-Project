# Simple Stock Trading Simulator

A TypeScript (Next.js + SQLite) conversion of the original PHP/Slim stock
trading simulator.

## Stack

| Original (PHP)      | Converted (TypeScript)                |
| ------------------- | ------------------------------------- |
| Slim 2 router       | Next.js App Router (server components)|
| Twig templates      | React/TSX (JSX) components            |
| MySQL + MeekroDB    | SQLite (Node built-in `node:sqlite`)  |
| PHP sessions        | Signed HMAC httpOnly cookie session   |
| `password_hash()`   | `bcryptjs`                            |
| Guzzle (CSV quotes) | Native `fetch` + CSV parsing          |

## Getting started

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET
npm run dev                  # http://localhost:3000
```

The SQLite database is created and seeded automatically (sample users,
symbols, portfolios, transactions) on first run at `data/trading.db`.

### Seeded demo accounts

| Email             | Password      |
| ----------------- | ------------- |
| grish@gmail.com   | gG560526      |
| Forza11879@gmail.com | Forzaforza77 |
| ipd9@gmail.com    | gG560526      |

## Routes

Landing `/`, register `/register`, login `/login`, watch list `/list`,
portfolio `/portfolio`, order details `/orders`, buy/sell `/buysell/[id]`,
charts `/chart/[symbol]`, history `/history`, contact `/contact`,
password reset `/passreset` and `/passreset/[token]`, logout `/logout`,
scheduled cleanup `/scheduled/daily`.

## Notes on the conversion

- The legacy Yahoo/Google Finance CSV endpoints no longer exist, so live quotes
  are fetched from the Yahoo Finance chart API (`/fetch/[symbol]`) and rendered
  with Highcharts on the client.
- Passwords are now hashed with bcrypt on register/reset, while still accepting
  the plain-text passwords present in the original DB dump.
- Password-reset emails are logged to the console unless `SMTP_*` env vars are
  configured.
- The default `SESSION_SECRET` is for development only — set a real secret in
  `.env.local`.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # start production server
npm run lint       # TypeScript type-check
```