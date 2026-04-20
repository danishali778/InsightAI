import os
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

# Ensure lazy loading to allow environment variables to load first
_cipher_suite = None

def _get_cipher() -> Fernet:
    global _cipher_suite
    if _cipher_suite is None:
        key_str = os.getenv("ENCRYPTION_KEY")
        if not key_str:
            logger.warning("ENCRYPTION_KEY not found in environment. Using a fallback key for development ONLY.")
            # Deterministic fallback key strictly for dev if missing. 
            # In production, this warns loudly and should be fixed.
            key_str = "TZZoA4e_0aRy3zO0u7FzjHwBq2L8y6b9R9oV8XmQ_Jw=" 
        
        try:
            _cipher_suite = Fernet(key_str.encode('utf-8'))
        except Exception as e:
            logger.error("Failed to initialize Fernet cipher suite: %s", e)
            raise
    return _cipher_suite

def encrypt(data: str | None) -> str | None:
    """Encrypt a string and return the base64-encoded encrypted token."""
    if not data:
        return data
    try:
        cipher = _get_cipher()
        encrypted_bytes = cipher.encrypt(data.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')
    except Exception as e:
        logger.error("Encryption failed: %s", e)
        # We don't want to swallow errors silently and return plaintext
        raise ValueError("Failed to encrypt data") from e

def decrypt(token: str | None) -> str | None:
    """Decrypt a base64-encoded encrypted token back to the original string."""
    if not token:
        return token
    try:
        cipher = _get_cipher()
        decrypted_bytes = cipher.decrypt(token.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        logger.error("Decryption failed. Data might be corrupted or key changed: %s", e)
        # Return none or raise, but raising ensures we don't accidentally pass garbage text down
        raise ValueError("Failed to decrypt data") from e
