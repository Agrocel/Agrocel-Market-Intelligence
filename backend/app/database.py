import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SQLITE_DB_PATH = (BASE_DIR / "market_intelligence.db").resolve()
DEFAULT_SQLITE_URL = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"

raw_db_url = os.getenv('DATABASE_URL', DEFAULT_SQLITE_URL)

def is_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def create_configured_engine(url: str):
    if url.startswith('sqlite'):
        return create_engine(url, connect_args={'check_same_thread': False}), url
    
    # Fast check if port 3306 is open
    if '3306' in url or 'localhost' in url:
        if not is_port_open('localhost', 3306, timeout=0.5):
            print(f"[DATABASE INFO] MySQL (localhost:3306) not active. Using local SQLite at {SQLITE_DB_PATH}")
            return create_engine(DEFAULT_SQLITE_URL, connect_args={'check_same_thread': False}), DEFAULT_SQLITE_URL
    try:
        eng = create_engine(url, pool_pre_ping=True)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng, url
    except Exception as e:
        print(f"[DATABASE WARNING] Primary database connection failed ({e}). Falling back to local SQLite at {SQLITE_DB_PATH}")
        return create_engine(DEFAULT_SQLITE_URL, connect_args={'check_same_thread': False}), DEFAULT_SQLITE_URL

engine, DATABASE_URL = create_configured_engine(raw_db_url)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
class Base(DeclarativeBase): pass
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
