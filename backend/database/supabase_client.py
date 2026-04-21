import os
from supabase import create_client, Client, ClientOptions, AsyncClient, AsyncClientOptions
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    # We'll allow this to be empty initially during migration setup, 
    # but it will crash if used without being set up.
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.")

# Sync options
options = ClientOptions(
    postgrest_client_timeout=30,
    storage_client_timeout=30,
)

# Async options
async_options = AsyncClientOptions(
    postgrest_client_timeout=30,
    storage_client_timeout=30,
)

# Sync client for legacy operations
supabase: Client = create_client(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=options)

# Async client for high-performance concurrent operations
async_supabase: AsyncClient = AsyncClient(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=async_options)
proxy_async_supabase = async_supabase # Compatibility alias if needed
