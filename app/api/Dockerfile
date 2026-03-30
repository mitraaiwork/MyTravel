FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files first (layer caching)
COPY pyproject.toml ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

EXPOSE 8000

# Run migrations then start the server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
