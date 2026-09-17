"""
Background Periodic News Ingestion Scheduler
Runs automated ingestion runs at configurable intervals (e.g. every 180 minutes)
and supports instantaneous thread-safe manual triggers.
"""

import time
import threading
from datetime import datetime
from typing import Optional, Dict, Any

from .pipeline import news_pipeline

class NewsScheduler:
    """Manages background periodic execution of news ingestion."""

    def __init__(self, interval_minutes: int = 180):
        self.interval_seconds = interval_minutes * 60
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._is_running = False
        self.last_run_at: Optional[datetime] = None
        self.last_run_stats: Optional[Dict[str, Any]] = None
        self.total_scheduled_runs = 0

    def start(self):
        """Starts the background scheduler thread."""
        if self._thread is not None and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._is_running = True
        self._thread = threading.Thread(target=self._run_loop, name="NewsSchedulerThread", daemon=True)
        self._thread.start()
        print(f"[SCHEDULER] News Ingestion Scheduler started (Interval: {self.interval_seconds // 60}m).")

    def stop(self):
        """Signals background thread to gracefully stop."""
        self._stop_event.set()
        self._is_running = False
        print("[SCHEDULER] News Ingestion Scheduler stopping...")

    def trigger_now(self) -> Dict[str, Any]:
        """Triggers an immediate pipeline run outside the scheduled interval."""
        print("[SCHEDULER] Manual news ingestion triggered.")
        stats = news_pipeline.run_pipeline(run_type="manual")
        self.last_run_at = datetime.utcnow()
        self.last_run_stats = stats
        return stats

    def get_status(self) -> Dict[str, Any]:
        """Returns scheduler state, last run timestamp, and statistics."""
        return {
            "is_running": self._is_running,
            "interval_minutes": self.interval_seconds // 60,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "total_scheduled_runs": self.total_scheduled_runs,
            "last_run_stats": self.last_run_stats
        }

    def _run_loop(self):
        """Continuous background loop waiting on interval or shutdown event."""
        # Wait 30 seconds after server startup before the first initial scheduled run
        if self._stop_event.wait(30):
            return

        while not self._stop_event.is_set():
            try:
                print("[SCHEDULER] Executing automated scheduled news ingestion...")
                stats = news_pipeline.run_pipeline(run_type="automated")
                self.last_run_at = datetime.utcnow()
                self.last_run_stats = stats
                self.total_scheduled_runs += 1
                print(f"[SCHEDULER] Automated run complete: {stats.get('new_articles_added', 0)} new articles added.")
            except Exception as e:
                print(f"[SCHEDULER ERROR] Scheduled ingestion encountered an exception: {e}")

            # Wait for next interval or stop signal
            if self._stop_event.wait(self.interval_seconds):
                break

# Singleton instance
news_scheduler = NewsScheduler(interval_minutes=180)
