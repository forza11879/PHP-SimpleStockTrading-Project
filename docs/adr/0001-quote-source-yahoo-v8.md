# Quote source: free keyless Yahoo v8, last-price only

The app needs live market data on a free tier for a publicly deployed
simulator. We chose the keyless Yahoo Finance v8 chart endpoint as the single
source for both quotes and daily history, fetched server-side with a small
cache to survive rate limits. Orders fill at the live last trade price, not
bid/ask.

Bid/ask was dropped because no free API offers real-time bid/ask; the realistic
free ceiling is near-real-time last price (Yahoo v8, Finnhub, Twelve Data),
15-min delayed (Alpaca), or end-of-day (Polygon/Massive, Alpha Vantage, FMP).
Twelve Data's free tier is licensed "internal non-display," ruling it out for a
public deployment; Finnhub free has no historical candles. Yahoo v8 is
ToS-grey (an unofficial endpoint) but requires no key and is already in use by
the chart page.