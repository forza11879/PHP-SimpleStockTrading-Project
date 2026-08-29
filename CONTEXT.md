# Trading Simulator

A fake-money stock trading simulator: learners practise buying and selling US
equities with virtual cash, using delayed live market data.

## Language

**Simulator**:
A fake-money practice environment, not a real brokerage. Users trade US
equities with virtual cash; no real money moves.
_Avoid_: platform, brokerage, exchange

**Quote**:
The current market price of a symbol — a near-real-time last-trade price
(15-minute delay acceptable), plus daily OHLC. Sourced from a free, keyless
feed; live bid/ask is out of scope.
_Avoid_: tick, bid, ask

**Symbol**:
A US equity tracked by the app (e.g. AAPL), identified by its ticker.
_Avoid_: stock, instrument

**Order**:
An instruction to buy or sell a whole number of shares at the current quote,
filled instantly. Market orders only.
_Avoid_: transaction, trade

**Position**:
A user's holding in a symbol: share quantity and average cost per share.
_Avoid_: portfolio row, holding

**Cash**:
A user's virtual USD balance.

**Equity**:
Total account value: cash plus the value of all positions at current quotes.

**Gain/Loss**:
Equity minus the initial $50,000 virtual cash grant.