"""
VAYUNET Weather In-Memory Cache
Provides 5-minute TTL caching keyed by location_id to prevent redundant external queries.
"""

import time
import threading
from typing import Dict, Any, Optional, Tuple


class WeatherCache:
    """
    Thread-safe TTL in-memory cache for meteorological data.
    """
    def __init__(self, default_ttl_seconds: int = 300):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Tuple[Dict[str, Any], int]]:
        """
        Retrieves cached weather data if still valid.
        Returns:
            Tuple of (data, age_seconds) or None if expired/missing.
        """
        now = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            age = int(now - entry["stored_at"])
            if age > entry["ttl"]:
                del self._cache[key]
                return None
            return entry["data"], age

    def set(self, key: str, data: Dict[str, Any], ttl_seconds: Optional[int] = None) -> None:
        """Stores weather data in cache with timestamp and TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._cache[key] = {
                "data": data,
                "stored_at": time.time(),
                "ttl": ttl
            }

    def clear(self) -> None:
        """Clears all cached entries."""
        with self._lock:
            self._cache.clear()


# Global singleton cache instance
weather_cache = WeatherCache(default_ttl_seconds=300)
