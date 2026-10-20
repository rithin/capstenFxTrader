---
name: nautilus-strategy
description: Use when writing or changing trading strategies, the trade manager, the risk manager, the event bridge actor, the trading node, or backtests in services/trading-node or services/backtest-worker (NautilusTrader code).
---

# Writing Nautilus code in this repo

## Where things go
- Strategies: `services/trading-node/capsten/strategies/<name>.py`. Subclass `CapstenStrategy` (M2.1), register in `registry.py`.
- Trade manager: `capsten/trade_manager/`. Risk manager: `capsten/risk/`. Event bridge + command handler: `capsten/bridge/`.
- Tests: `services/<svc>/tests/` mirror the package path. Backtest-based tests use small fixtures in `tests/fixtures/`.

## Looking things up cheaply
1. Use context7 for `nautilus_trader` API questions first.
2. Then read ONE targeted doc: `vendor/nautilus_trader/docs/concepts/{strategies,actors,orders,positions,portfolio,cache,message_bus,live,reports,visualization,configuration}.md`
   or `.../concepts/backtesting/`.
3. Examples: `vendor/nautilus_trader/examples/` (grep for the exact class name; don't list the directory tree).
4. Use Serena or LSP to jump to a symbol in the installed package. Never grep all of `vendor/`.

## Rules
- Prices and sizes: `Price`, `Quantity`, `Money` or `Decimal`. Never float math on money.
- Strategies never talk to Redis, Postgres or HTTP. They emit Nautilus events, and the bridge actor translates them to contracts.
- Config is a frozen `StrategyConfig` subclass. Every tunable lives in config so the UI and backtests can set it.
- Orders that open a position must carry SL (bracket or OTO), unless the strategy config explicitly says otherwise.
- Risk checks run before order submission (`capsten/risk`), and Nautilus `RiskEngine` limits stay enabled as the second layer.
- Default venue/account in any new config = sandbox or paper.

## Test pattern
- Unit tests: pure logic (sizing, signal calculation) with no engine.
- Behaviour tests: a `BacktestEngine` with a few hundred bars from fixtures; assert on orders and positions from the engine's reports.
- Every risk rule needs a test that proves it **blocks** or **halts**.
