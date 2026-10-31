import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

# Custom or Cloud DATABASE_URL
env_db_url = os.getenv("DATABASE_URL")

if env_db_url:
    # Ensure correct dialect prefix if needed
    if env_db_url.startswith("mysql://"):
        env_db_url = env_db_url.replace("mysql://", "mysql+pymysql://", 1)
    DATABASE_URL = env_db_url
else:
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "1234")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB = os.getenv("MYSQL_DB", "shop_credit_db")
    DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args={"connect_timeout": 3} if "mysql" in DATABASE_URL else {}
    )
    with engine.connect() as conn:
        pass
    print("Database connected successfully.")
except Exception as e:
    sqlite_file = "/tmp/shop_credit.db" if is_vercel else "./shop_credit.db"
    print(f"Primary database connection unavailable ({e}). Using SQLite fallback at: {sqlite_file}")
    DATABASE_URL = f"sqlite:///{sqlite_file}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
