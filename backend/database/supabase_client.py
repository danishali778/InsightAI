import os
from supabase import create_client, Client, ClientOptions, create_async_client, AsyncClient
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.")

# Initial stabilization step: Increase timeouts to reduce protocol disconnects
options = ClientOptions(
    postgrest_client_timeout=30,
    storage_client_timeout=30,
)

# Traditional Sync Client
supabase: Client = create_client(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=options)

# Modern Async Client for FastAPI non-blocking I/O
async_supabase: AsyncClient = AsyncClient(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=options)

