from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "dev"
    redis_url: str = "redis://localhost:6379/0"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "capsten"
    postgres_user: str = "capsten"
    postgres_password: str = ""
    health_stream: str = "events.health"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
