import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    # We'll allow this to be empty initially during migration setup, 
    # but it will crash if used without being set up.
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.")

# Initial stabilization step: Increase timeouts to reduce protocol disconnects
options = ClientOptions(
    postgrest_client_timeout=30,  # Increase to 30s
    storage_client_timeout=30,
)

supabase: Client = create_client(SUPABASE_URL or "", SUPABASE_SERVICE_KEY or "", options=options)
