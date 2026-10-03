import os


class Settings:
    PROJECT_NAME = "TACTICAL-SIM"
    VERSION = "2.0.0"
    API_PREFIX = "/api"
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3100,http://127.0.0.1:3000,http://127.0.0.1:3100",
    ).split(",")
    MAX_EXERCISES = 128
    MAX_CONNECTIONS_PER_ROOM = 32
    ROOM_TTL_SECONDS = 86400


settings = Settings()
