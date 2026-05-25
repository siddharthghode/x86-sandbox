from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = "django-insecure-asm-re-playground-dev-key"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = "urls"

DATABASES = {}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
