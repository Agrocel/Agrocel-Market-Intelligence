"""
Agrocel Bromine Market Intelligence Pilot - Unified Application Launcher
Starts both the FastAPI backend (port 8000) and the Vite frontend (port 5173).
Handles clean shutdown of both processes when interrupted (Ctrl+C).
"""

import os
import sys
import subprocess
import signal
import time
import threading
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"

processes = []

def stream_output(process, prefix, color_code):
    """Streams stdout/stderr from child process with formatted prefix."""
    reset_code = "\033[0m"
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            clean_line = line.rstrip()
            if clean_line:
                print(f"{color_code}{prefix}{reset_code} {clean_line}", flush=True)
    except Exception:
        pass

def cleanup():
    """Terminates child processes on shutdown."""
    print("\n\033[33m[LAUNCHER] Shutting down application services...\033[0m", flush=True)
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    print("\033[32m[LAUNCHER] Services stopped successfully.\033[0m", flush=True)

def signal_handler(sig, frame):
    cleanup()
    sys.exit(0)

def main():
    # Enable ANSI escape sequences on Windows console
    if sys.platform == "win32":
        os.system("")

    print("\033[1;36m" + "=" * 70 + "\033[0m")
    print("\033[1;36m   AGROCEL BROMINE MARKET INTELLIGENCE PILOT - LOCAL RUNNER\033[0m")
    print("\033[1;36m" + "=" * 70 + "\033[0m\n")

    # Register signals for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 1. Start Backend
    print("\033[32m[1/2] Starting FastAPI Backend on http://localhost:8000 ...\033[0m", flush=True)
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        shell=(sys.platform == "win32")
    )
    processes.append(backend_proc)

    # 2. Start Frontend
    print("\033[34m[2/2] Starting Vite Frontend on http://localhost:5173 ...\033[0m", flush=True)
    frontend_cmd = ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        shell=(sys.platform == "win32")
    )
    processes.append(frontend_proc)

    # Stream output in background threads
    t_backend = threading.Thread(target=stream_output, args=(backend_proc, "[BACKEND]", "\033[32m"), daemon=True)
    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc, "[FRONTEND]", "\033[34m"), daemon=True)
    t_backend.start()
    t_frontend.start()

    print("\n\033[1;32m[OK] All services launched!\033[0m", flush=True)
    print("  * Frontend UI : \033[4;36mhttp://localhost:5173\033[0m", flush=True)
    print("  * Backend API : \033[4;36mhttp://localhost:8000/docs\033[0m", flush=True)
    print("\n\033[90mPress Ctrl+C to stop all services.\033[0m\n", flush=True)

    try:
        while True:
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print("\033[31m[BACKEND] Process terminated.\033[0m", flush=True)
                break
            if frontend_proc.poll() is not None:
                print("\033[31m[FRONTEND] Process terminated.\033[0m", flush=True)
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
