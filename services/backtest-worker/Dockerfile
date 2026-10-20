FROM python:3.12-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /bin/uv
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY pyproject.toml .
RUN uv pip install --system --no-cache -r pyproject.toml
COPY backtest_worker ./backtest_worker

# `make test m=backtest-worker` / `make lint m=backtest-worker` run here: nautilus_trader has no Intel-Mac wheel, so tests run in Linux.
FROM base AS test
RUN uv pip install --system --no-cache pytest ruff
COPY tests ./tests
RUN ruff check --select E,F,W,I,UP,B --line-length 110 backtest_worker tests && ruff format --check --line-length 110 backtest_worker tests
RUN python -m pytest -q -p no:cacheprovider tests

FROM base
RUN useradd --uid 10001 --no-create-home app
USER 10001
EXPOSE 8080
CMD ["python", "-m", "backtest_worker.main"]
