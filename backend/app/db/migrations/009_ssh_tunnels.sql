-- Add SSH Tunneling parameters to database_connections
ALTER TABLE public.database_connections
ADD COLUMN use_ssh BOOLEAN DEFAULT FALSE,
ADD COLUMN ssh_host TEXT,
ADD COLUMN ssh_port INTEGER,
ADD COLUMN ssh_username TEXT,
ADD COLUMN ssh_password TEXT,
ADD COLUMN ssh_private_key TEXT;
