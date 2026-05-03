import logging

from supabase import AsyncClient, AsyncClientOptions, Client, ClientOptions, create_client

from app.core.config import settings


logger = logging.getLogger(__name__)

SUPABASE_URL = settings.supabase_url
SUPABASE_SERVICE_KEY = settings.supabase_service_role_key

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.")

options = ClientOptions(
    postgrest_client_timeout=30,
    storage_client_timeout=30,
)

async_options = AsyncClientOptions(
    postgrest_client_timeout=30,
    storage_client_timeout=30,
)

supabase: Client = create_client(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=options)
async_supabase: AsyncClient = AsyncClient(
    SUPABASE_URL or "",
    SUPABASE_SERVICE_KEY or "",
    options=async_options,
)

def is_supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    return supabase


def get_async_supabase() -> AsyncClient:
    return async_supabase


proxy_async_supabase = async_supabase
