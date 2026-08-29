# Simulator order model: market orders only, integer shares, no fees

This is a fake-money simulator for learners, not a brokerage. Orders are
market-only, fill instantly at the current quote, whole shares only, and carry
no fees or commissions. The spread is gone (orders price at last price, per
ADR-0001); the only cost of trading is the market itself.

Realism was deliberately deferred: no order types (limit/stop), no shorting,
no fractional shares, no realized-vs-unrealized P&L accounting. Adding fees,
order types, or position lots is possible later and would slot into this model
without reworking the redesign.