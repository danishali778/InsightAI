"""Security helpers for encryption and auth-related utilities."""

import logging

from cryptography.fernet import Fernet

from app.core.secrets import get_encryption_key


logger = logging.getLogger(__name__)
_cipher_suite: Fernet | None = None


def _get_cipher() -> Fernet:
    global _cipher_suite
    if _cipher_suite is None:
        key_str = get_encryption_key()
        try:
            _cipher_suite = Fernet(key_str.encode("utf-8"))
        except Exception as exc:
            logger.error("Failed to initialize Fernet cipher suite: %s", exc)
            raise
    return _cipher_suite


def encrypt(data: str | None) -> str | None:
    """Encrypt a string and return the base64-encoded encrypted token."""
    if not data:
        return data
    try:
        cipher = _get_cipher()
        encrypted_bytes = cipher.encrypt(data.encode("utf-8"))
        return encrypted_bytes.decode("utf-8")
    except Exception as exc:
        logger.error("Encryption failed: %s", exc)
        raise ValueError("Failed to encrypt data") from exc


def decrypt(token: str | None) -> str | None:
    """Decrypt a base64-encoded encrypted token back to the original string."""
    if not token:
        return token
    try:
        cipher = _get_cipher()
        decrypted_bytes = cipher.decrypt(token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception as exc:
        logger.error("Decryption failed. Data might be corrupted or key changed: %s", exc)
        raise ValueError("Failed to decrypt data") from exc


__all__ = ["encrypt", "decrypt"]
