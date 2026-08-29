# Free stock quote APIs for a trading simulator (research, 2026)

**Date:** 2026-08-29
**Scope:** US equities, no-cost tier, server-side fetching (Node/Next.js), for a **simulator** (paper trading, not production/execution).
**Status:** Research only — no code written. Verdict + recommendation table at the end.

## The two requirements that matter

1. **Live-ish quotes** — bid/ask, or at minimum last price + daily OHLC, to display a watchlist and price simulated buy/sell orders.
2. **~1 year of daily OHLC** history for candlestick charts.

Everything else (signup friction, ToS, rate limits) is scored against those two.

---

## 0. Status of what the codebase uses today

Current code in this repo:

- `src/lib/history.ts` → `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1y`
- `src/lib/quotes.ts` → `https://download.finance.yahoo.com/d/quotes.csv?...`

**The CSV quote endpoint is dead.** Yahoo shut down `download.finance.yahoo.com/d/quotes.csv` in **November 2017** for "use in violation of the Yahoo Terms of Service"; it has never returned data since. `fetchAndStoreQuotes()` silently returns `false` today. ([Stack Overflow: "Did Yahoo Finance just discontinue their CSV download?"](https://stackoverflow.com/questions/47099005/did-yahoo-finance-just-discontinue-their-csv-download))

The **v8 chart endpoint is still alive** as of mid-2026 (100% uptime over a 90-day monitoring window ending ~Jul 2026; a live response capture returned real AAPL OHLC) — but it is an *unofficial, internal* endpoint (details in §1).

---

## 1. Yahoo Finance chart API (`query1.finance.yahoo.com/v8/finance/chart`)

- **Still working in 2026?** Yes. Live probes show ~100% uptime through July 2026 and the endpoint has not changed shape ([shipapis monitor of `GET /v8/finance/chart/AAPL?interval=1d&range=1d`, healthy, monitored 2026-07-05](https://shipapis.dev/api/yahoo-finance-chart); [GitHub issue referencing its use May 2026](https://github.com/koala73/worldmonitor/issues/3731)).
- **Current quote?** Last price, yes — `chart.result[0].meta.regularMarketPrice`, plus `previousClose`, currency, exchange, and intraday OHLCV if you request `interval=1m&range=1d` (or `range=5d&interval=1d` and take the last candle). **No bid/ask.** ([Stack Overflow sample response](https://stackoverflow.com/questions/76059562/yahoo-finance-api-get-quotes-returns-invalid-cookie/76064985))
- **1yr daily history?** Yes — `range=1y&interval=1d` returns the full year of daily OHLCV (this is what `history.ts` already does).
- **Rate limits:** None published. Unofficial; Yahoo throttles aggressively and returns HTTP 429 to IPs it doesn't like (repeatedly observed; see [GitHub issue documenting 429s and proxy evasion](https://github.com/koala73/worldmonitor/issues/3731)). Some sub-endpoints require a crumb/cookie handshake; the v8 chart endpoint generally does not, but behavior changes without notice.
- **Signup/API key:** None.
- **ToS:** This is the crux. The endpoint is **not** documented in Yahoo's Developer Network, not covered by any Yahoo Developer API agreement, and Yahoo's ToS (§4.5) prohibits data-mining/substantial automated extraction of service data. ([Yahoo Developer API Terms of Use](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html); [ToS-violation report May 2026](https://github.com/koala73/worldmonitor/issues/3731)). For a **personal/hobby** simulator it is the de-facto standard (the `yfinance` ecosystem), but it is legally grey and can break or get IP-blocked at any time — you accept that risk.
- **Freshness:** Near-real-time last trade price during market hours (updates continuously), not NBBO bid/ask.

---

## 2. Alpha Vantage

- **Free tier limits:** 25 requests/day, 5 requests/minute. (Official: [alphavantage.co/premium](https://www.alphavantage.co/premium/), [alphavantage.co/support](https://www.alphavantage.co/support/); corroborated by [GitHub issue #109153](https://github.com/home-assistant/core/issues/109153).)
- **Freshness on free tier:** End-of-day only for US equities. Alpha Vantage states that "realtime and 15-minute delayed US market data" is **premium-only** (regulated/licensed by exchanges/FINRA/SEC). ([alphavantage.co/support](https://www.alphavantage.co/support/))
- **Bid/ask?** No (free). `GLOBAL_QUOTE` returns last price + change + OHLC-ish fields for the latest session.
- **1yr daily history?** Yes — `TIME_SERIES_DAILY` with `outputsize=full` gives 20+ years of EOD daily OHLCV. ([Alpha Vantage docs](https://www.alphavantage.co/documentation/))
- **Signup/key:** Free API key via email, no credit card.
- **ToS:** Free key is for learning/prototyping; attribution requested; no redistribution. The 25/day cap makes live watchlist polling impossible (one symbol polled every ~5 min exhausts the day in ~2 hours), but it is a fine *history* source or fallback.

---

## 3. Finnhub

- **Free tier limits:** 60 calls/minute (+ a 30 calls/second cap on top). ([finnhub.io/pricing](https://finnhub.io/pricing))
- **Freshness:** Finnhub markets the free tier as "real-time US quotes," but at least one production user reports the free accounts are effectively a **delayed tier** while the licensed plan is real-time ([Tapeboard data-source disclosure, Jul 2026](https://www.tapeboard.com/data-sources)). Treat the free-tier freshness as *near-real-time at best, possibly delayed*.
- **Quote fields:** `{c, h, l, o, pc, d, dp, t}` — current price, daily high/low/open, previous close. **No bid/ask.** ([Finnhub Quote docs](https://finnhub.io/docs/api/quote))
- **1yr daily history?** **No.** The `/stock/candle` endpoint is premium-gated, and Finnhub's own team confirmed (Apr 2025): *"free plan never allowed access to /stock/candle endpoint."* ([GitHub issue #546](https://github.com/finnhubio/Finnhub-API/issues/546)). Historical OHLC on the free plan is effectively not available.
- **Signup/key:** Free token from email signup, no credit card.
- **ToS:** Free plan is licensed **"Personal Use. Terms apply"** (non-commercial). ([finnhub.io/pricing](https://finnhub.io/pricing))
- **Verdict:** Great real-time quote polling on paper, but **fails the history requirement** on free. Only usable if you pair it with a separate history source.

---

## 4. Twelve Data

- **Free tier (Basic):** 8 API credits/minute, **800 credits/day**, + 8 trial WebSocket credits. Standard endpoints cost 1 credit; heavier ones cost more. ([twelvedata.com/pricing](https://twelvedata.com/pricing), [pricing.md](https://twelvedata.com/pricing.md))
- **Freshness:** Official material says Basic includes **real-time US equities and ETFs**, forex, and crypto. Independent reviews claim a small delay on the free tier ("typically 1–15 minutes depending on the exchange"; one claims 4 hours). Official claim is real-time; treat the *true* free-tier freshness as real-time-or-slightly-delayed. ([twelvedata.com/pricing](https://twelvedata.com/pricing); [CodeWords review](https://www.codewords.ai/blog/twelve-data-api); [dev.to 2026 comparison](https://dev.to/nexgendata/best-free-stock-market-apis-and-data-tools-in-2026-a-developers-honest-comparison-1926))
- **Bid/ask?** The `/price` quote response includes `bid`/`ask` for some instruments (documented example is for forex/currency); for US equities you generally get last price + daily OHLC. Not a reliable bid/ask source for stocks on the free tier. ([twelvedata.com/docs](https://twelvedata.com/docs))
- **1yr daily history?** Yes — `time_series?interval=1day&outputsize=5000` returns well over a year of daily OHLCV (30+ years available on major symbols). Use `start_date`/`end_date` bounds. ([Twelve Data support: historical prices](https://support.twelvedata.com/en/articles/5656039-how-to-get-historical-prices))
- **Signup/key:** Email signup, instant key, no credit card.
- **ToS gotcha (important for a *public* hobby app):** the Basic (free) plan is **"internal non-display usage"** and Individual plans are for personal/internal/non-commercial use. Displaying the data to other people (a public app) technically requires a Business plan (Venture, $149/mo) for "external display data access." ([twelvedata.com/pricing.md](https://twelvedata.com/pricing.md), [twelvedata.com/pricing](https://twelvedata.com/pricing)). For a private/self-hosted hobby simulator it's fine; for a publicly-deployed one it's a licensing grey area.
- **Bonus:** `/batch` endpoint fetches many symbols in one call (counted in credits) — useful for a watchlist within 800/day.

---

## 5. Polygon.io (now **Massive**)

- **Rebrand note:** Polygon.io rebranded to **Massive** in early 2026; `polygon.io/pricing` redirects to `massive.com/pricing`. Same API, same keys, endpoints unchanged. ([Massive pricing, current](https://massive.com/pricing?product=stocks); [APICostCalc note](https://apicostcalc.com/polygon.html))
- **Free tier (Stocks Basic):** **5 API calls/minute**, **2 years of historical data**, 100% market coverage, **end-of-day data**, reference data, corporate actions, technical indicators, minute aggregates. ([Massive pricing page — fetched live](https://massive.com/pricing?product=stocks))
- **Freshness:** **EOD only on the free tier.** 15-min delayed starts at Starter ($29/mo); real-time starts at Advanced ($199/mo). Free "Basic" is explicitly "End of Day Data."
- **Bid/ask?** No. "Quotes" (bid/ask) only appear at the Advanced tier. Daily aggregates (`v2/aggs`) give OHLCV + volume.
- **1yr daily history?** Yes — 2 years included on free, well above the 1-year need. (`v2/aggs/ticker/AAPL/range/1/day/...`)
- **Signup/key:** Email signup, free key, no credit card.
- **ToS:** "Individual use" license for the individual tiers; commercial/redistribution needs a business plan. Cleanest published terms of the licensed providers.
- **Verdict:** The 5/min limit means one watchlist refresh of ~20 symbols takes 4 minutes, and quotes are EOD (prior close during the session, not a live last price). Great for **history**, weak for **live-ish quotes** on the free tier.

---

## 6. Financial Modeling Prep (FMP)

- **Free tier (Basic):** **250 API requests/day**; also a 500 MB/month bandwidth cap and ~4 req/sec parallelism. ([FMP pricing plans](https://site.financialmodelingprep.com/pricing-plans), [FMP how-to](https://site.financialmodelingprep.com/how-to/five-key-steps-to-integrate-fmp-apis-without-writing-a-single-line-of-code))
- **Freshness:** End-of-day historical data only. Real-time U.S. requires the paid Starter plan ($22/mo). ([FMP pricing plans](https://site.financialmodelingprep.com/pricing-plans))
- **Bid/ask?** No (free).
- **1yr daily history?** Yes — free plan includes ~5 years of daily chart data for US symbols. ([FMP account guide](https://site.financialmodelingprep.com/how-to/how-to-create-a-financial-modeling-prep-account))
- **Signup/key:** Free key via email, no credit card.
- **ToS:** Free plan is **"Personal Use Only," US data only**, no premium endpoints. Data *display/redistribution* requires a separate "FMP Data Display and Licensing Agreement." ([FMP account guide](https://site.financialmodelingprep.com/how-to/how-to-create-a-financial-modeling-prep-account); [Find My Moat review](https://www.findmymoat.com/tools/financial-modeling-prep-fmp))

---

## 7. IEX Cloud — **discontinued, confirmed**

IEX Group announced retirement on **May 31, 2024** and the service was **fully shut down August 31, 2024** (all endpoints dead, accounts inactive). It was <2% of IEX Group revenue and had operated at a loss. Not viable. ([IEX retirement notice](https://iexcloud.org/), [Alpha Vantage migration analysis](https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration), [API Evangelist sunset profile](https://github.com/api-evangelist/iex-cloud), [FintegrationFS FAQ: "Is the IEX Cloud API still available in 2026? No."](https://www.fintegrationfs.com/fintechapisusa/iex-cloud-api))

**Footnote:** ex-IEX Cloud staff relaunched the platform as **Blue Sky Data** in Sept 2024, but it is a new, independently-owned commercial vendor — not the free-tier IEX Cloud of old. Don't plan around it. ([LSE Directory profile](https://londonstrategicedge.com/directory/data-providers/iex-cloud/))

---

## 8. Other notable free options

### Stooq (free, no key)
- Polish service, free **daily** historical CSV downloads (daily/hourly/5-min files) for US (`.US` suffix: `AAPL.US`, `SPY.US`), indices, FX, world markets. No API key. ([stooq.com/db/h](https://stooq.com/db/h), [live CSV example for SPY.US](https://stooq.com/q/d/?s=spy.us&i=d&d1=20250515&d2=20260520&l=4))
- **Freshness:** End-of-day; current-day files published ~13:15 CET. No bid/ask.
- **ToS:** "intended solely for personal use. Any commercial use is prohibited." ([stooq.com/db/h](https://stooq.com/db/h))
- **Rate limits:** No published number; "reasonable use" expected. Good as a no-key history fallback; pairing it with a live price source covers quotes.

### Tiingo
- Free "Power User" starter: ~**50 requests/hour**, 500 unique symbols/day; EOD US prices + real-time IEX data (Tiingo runs its own cross-connect to the IEX exchange — the *exchange* survived IEX Cloud's shutdown). ([Tiingo pricing](https://www.tiingo.com/about/pricing), [Tiingo rate limits profile](https://apis.io/rate-limits/tiingo/tiingo-rate-limits))
- **Freshness:** EOD (full history) + IEX real-time via REST/WebSocket on free.
- **Bid/ask?** IEX quotes via WebSocket, yes; EOD prices no.
- **ToS:** free/individual = internal use; redistribution requires license. Worth a look, but 50 req/hr is tight for a live watchlist.

### Schwab Market Data API (free with a brokerage account) — **the only true real-time + bid/ask free option**
- Free with any Schwab brokerage account (opening one is free); OAuth 2.0; community-measured **~120 requests/min** market-data limit. ([developer.schwab.com](https://developer.schwab.com/products/market-data-api), [DeepWiki client reference](https://deepwiki.com/tylerebowers/Schwabdev/3-client-api-reference), [SchwabPy rate-limit notes](https://github.com/jaycollett/SchwabPy))
- **Quote fields include bid/ask:** `bidPrice`, `bidSize`, `askPrice`, `askSize`, `lastPrice`, daily OHLC, 52-wk high/low. ([SchwabPy quote model](https://github.com/ibouazizi/schwab-trader/blob/main/docs/API_REFERENCE.md))
- **History:** `priceHistory` endpoint returns daily candles (1yr+ easily; adjust granularity with `periodType`/`frequencyType`). ([SchwabPy example](https://github.com/jaycollett/SchwabPy))
- **Freshness:** True real-time during market hours.
- **Caveats:** Requires a brokerage account + OAuth token/refresh flow (heavier integration than an API key), and ToS are for personal use tied to your Schwab account. No bulk multi-ticker quote endpoint (batch manually).

### Alpaca (free tier)
- Free market-data plan: **200 API calls/min**, REST data **15-min delayed**, real-time **IEX-only** WebSocket (max 30 symbols), **7+ years** historical bars. ([alpaca.markets/data](https://alpaca.markets/data), [apis.io plan profile](https://apis.io/plans/alpaca/alpaca-plans-pricing/))
- Good fit if the simulator is also an Alpaca paper-trading app; free tier gives both live-ish quotes and deep history. IEX-only real-time is a subset of the tape.

### Marketstack
- Free tier ~250 requests/**month**. Too small to be useful here. ([Marketstack](https://marketstack.com))

### Nasdaq Data Link (formerly Quandl)
- Free tier exists for select datasets; not a practical single-vendor US-equities quote+history source for this use case. (Mentioned only for completeness.)

---

## 9. Recommendation table

Legend: **RT** = real-time; **~RT** = near-real-time last price; **D15** = 15-min delayed; **EOD** = end-of-day only.

| Provider | Free limits | Freshness (free) | Bid/ask (free) | 1yr daily history (free) | Key/signup | ToS fit for a public hobby app |
|---|---|---|---|---|---|---|
| **Yahoo v8 chart** (unofficial) | none published (throttled, 429s) | **~RT** last price | No | **Yes** | none | **Grey** — ToS prohibits automated extraction; no SLA, can break anytime |
| **Alpha Vantage** | 25 req/day, 5/min | **EOD** | No | **Yes** (20+ yrs) | email key | OK for personal; attribution |
| **Finnhub** | 60 calls/min | **~RT** (some report delayed on free) | No | **No** (candles premium-only) | email token | personal, non-commercial |
| **Twelve Data Basic** | 8 credits/min, 800/day | **RT** US (per official; indep. reviews say slight delay) | No (equities) | **Yes** (30+ yrs) | email key | **Grey for public display** — free = "internal non-display"; Business plan needed to show data publicly |
| **Polygon / Massive Basic** | 5 calls/min | **EOD** | No | **Yes** (2 yrs) | email key | Individual-use; cleanest of the licensed vendors |
| **FMP Basic** | 250 req/day | **EOD** | No | **Yes** (~5 yrs) | email key | personal use; display needs license |
| **IEX Cloud** | — | — | — | — | — | **Shut down Aug 31, 2024** |
| **Stooq** | unlisted ("reasonable use") | **EOD** | No | **Yes** (decades, CSV) | none | personal/non-commercial only |
| **Tiingo** | ~50 req/hr, 500 sym/day | EOD + IEX real-time | IEX quotes (WS) | **Yes** | email key | internal use; redistrib needs license |
| **Schwab Market Data API** | ~120 req/min | **RT** | **Yes** (bid/ask) | **Yes** | free brokerage account + OAuth | personal, tied to your account |
| **Alpaca** | 200 calls/min | **D15** REST; RT on IEX-only WS (30 sym) | IEX quotes via WS | **Yes** (7+ yrs) | free account | personal/paper-trading |

---

## 10. Verdict

**Best single free API for "quotes + 1yr history for a simulator":**

1. **Twelve Data (Basic, free)** — the only licensed free tier that delivers all three requirements from one key: real-time-ish US quotes, full daily history (way more than 1 year), and an 800-request/day ceiling that fits a watchlist via the `/batch` endpoint (8/min is the real constraint; a 20-symbol watchlist refreshes about every 2–3 min). **Caveat:** its free license is "internal non-display" — fine for a private/self-hosted simulator, a licensing grey area if you deploy it publicly.

2. **Polygon.io / Massive (Basic, free)** — the safest *licensing* choice (explicit individual-use terms, no display gotcha) with 2 years of daily history for charts. But quotes are **end-of-day only** on the free tier and 5 calls/min is tight, so it does not satisfy the "live-ish quote" requirement on its own.

**Realistic data-freshness ceiling on free tiers (2026):**
- **True real-time NBBO bid/ask: only via a brokerage API** — **Schwab** (free, real-time, bid/ask + history, needs a brokerage account + OAuth) or Alpaca's real-time **IEX-only** WebSocket. No commercial "free API-key" provider gives real-time bid/ask at $0.
- **Near-real-time last price (no bid/ask):** Yahoo v8 chart endpoint (works today, unofficial/grey) or Finnhub/Twelve Data free quotes (real-time claim, some independent reports of delay).
- **Delayed (15 min):** Alpaca REST free tier.
- **End-of-day:** Alpha Vantage free, FMP free, Polygon Basic free, Stooq.

**Suggested stack for the app as currently architected:**
- Keep **Yahoo v8 chart** for history (works, no key, already implemented in `history.ts`) **and** add it as the live-last-price source — but replace the dead `d/quotes.csv` call in `quotes.ts` with the v8 chart endpoint (`range=1d&interval=1m` → last candle + `meta.regularMarketPrice`), which restores live-ish watchlist quotes at zero cost.
- Add **one licensed fallback** with a real key for robustness: **Twelve Data** if you're happy with the internal/non-display license (it also provides the 1yr history), or **Polygon/Massive Basic** if you want the cleanest terms (use it for the 1yr history and accept EOD quotes; keep Yahoo for the intraday last price).
- If you're willing to open a free brokerage account, **Schwab** replaces both of the above with genuinely real-time quotes including bid/ask, at the cost of a heavier OAuth integration.

**Bottom line:** no free, no-key provider gives real-time bid/ask. The realistic ceiling for "live-ish" on free tiers is a **near-real-time last trade price (Yahoo/Finnhub/Twelve Data)** or **15-min delayed (Alpaca)**, and **EOD** from most "free API key" vendors. For a *simulator* that ceiling is fine — bid/ask for order pricing can be modeled (e.g., a synthetic spread around the last price) since no real execution is happening.

---

## Sources

- Yahoo CSV shutdown: https://stackoverflow.com/questions/47099005/did-yahoo-finance-just-discontinue-their-csv-download
- Yahoo v8 chart live/working + sample: https://shipapis.dev/api/yahoo-finance-chart ; https://stackoverflow.com/questions/76059562/yahoo-finance-api-get-quotes-returns-invalid-cookie/76064985
- Yahoo ToS / 429 / ToS-violation: https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html ; https://github.com/koala73/worldmonitor/issues/3731
- Alpha Vantage limits/premium: https://www.alphavantage.co/premium/ ; https://www.alphavantage.co/support/ ; https://github.com/home-assistant/core/issues/109153 ; https://www.alphavantage.co/documentation/
- Finnhub pricing/limits: https://finnhub.io/pricing ; https://finnhub.io/docs/api/rate-limit ; https://finnhub.io/docs/api/quote
- Finnhub free has no candles (vendor statement): https://github.com/finnhubio/Finnhub-API/issues/546
- Finnhub free freshness: https://www.tapeboard.com/data-sources
- Twelve Data pricing/terms: https://twelvedata.com/pricing ; https://twelvedata.com/pricing.md ; https://support.twelvedata.com/en/articles/5335783-trial ; https://support.twelvedata.com/en/articles/5656039-how-to-get-historical-prices
- Twelve Data delay (independent): https://www.codewords.ai/blog/twelve-data-api ; https://dev.to/nexgendata/best-free-stock-market-apis-and-data-tools-in-2026-a-developers-honest-comparison-1926
- Polygon/Massive pricing (fetched live): https://massive.com/pricing?product=stocks ; https://qveris.ai/guides/polygon-pricing-optimized ; https://tradingtoolshub.com/review/polygon-io/
- FMP pricing/terms: https://site.financialmodelingprep.com/pricing-plans ; https://site.financialmodelingprep.com/how-to/how-to-create-a-financial-modeling-prep-account ; https://site.financialmodelingprep.com/faqs
- IEX Cloud shutdown: https://iexcloud.org/ ; https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration ; https://github.com/api-evangelist/iex-cloud ; https://www.fintegrationfs.com/fintechapisusa/iex-cloud-api ; https://londonstrategicedge.com/directory/data-providers/iex-cloud/
- Stooq: https://stooq.com/db/h ; https://stooq.com/q/d/?s=spy.us&i=d&d1=20250515&d2=20260520&l=4
- Tiingo: https://www.tiingo.com/about/pricing ; https://apis.io/rate-limits/tiingo/tiingo-rate-limits ; https://www.tiingo.com/documentation/general/overview
- Schwab: https://developer.schwab.com/products/market-data-api ; https://github.com/jaycollett/SchwabPy ; https://deepwiki.com/tylerebowers/Schwabdev/3-client-api-reference ; https://github.com/ibouazizi/schwab-trader/blob/main/docs/API_REFERENCE.md
- Alpaca: https://alpaca.markets/data ; https://apis.io/plans/alpaca/alpaca-plans-pricing/ ; https://forum.alpaca.markets/t/solutions-for-getting-bars-missing-due-to-15-minute-historical-delay/8913