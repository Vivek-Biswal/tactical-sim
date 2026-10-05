import os


class Settings:
    PROJECT_NAME = "CHAKRAVYUH"
    VERSION = "2.0.0"
    API_PREFIX = "/api"
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3100,http://127.0.0.1:3000,http://127.0.0.1:3100",
    ).split(",")
    STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "memory")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "tactical-sim-d3bf4")
    AUTH_MODE = os.getenv("AUTH_MODE", "firebase")
    DEPLOYED_ENVIRONMENT = bool(
        os.getenv("RENDER")
        or os.getenv("VERCEL")
        or os.getenv("K_SERVICE")
        or os.getenv("ENVIRONMENT", "").lower() in ("production", "prod", "staging")
    )
    FIRESTORE_DATABASE_ID = os.getenv("FIRESTORE_DATABASE_ID", "(default)")
    FIRESTORE_CHECKPOINT_SECONDS = max(
        1, float(os.getenv("FIRESTORE_CHECKPOINT_SECONDS", "5"))
    )
    FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    MAX_EXERCISES = 128
    MAX_CONNECTIONS_PER_ROOM = 32
    MAX_MEMBERS_PER_ROOM = 128
    ROOM_TTL_SECONDS = 86400


settings = Settings()
