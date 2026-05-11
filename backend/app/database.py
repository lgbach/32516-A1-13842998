import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_USER = os.getenv("MONGO_USER", "root")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "root")
MONGO_HOST = os.getenv("MONGO_HOST", "127.0.0.1")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
MONGO_DB = os.getenv("MONGO_DB", "expense_tracker")
MONGO_AUTH_SOURCE = os.getenv("MONGO_AUTH_SOURCE", "admin")

# MongoDB Connection String
MONGODB_URL = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/?authSource={MONGO_AUTH_SOURCE}"

# Global MongoDB client
_client = None
_db = None


def get_mongodb_client():
    """Get MongoDB client singleton"""
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    return _client


def get_database():
    """Get MongoDB database instance"""
    global _db
    if _db is None:
        client = get_mongodb_client()
        _db = client[MONGO_DB]
    return _db


def get_db():
    """Dependency to get database (for FastAPI Depends)"""
    return get_database()


def init_db():
    """Initialize MongoDB connection and create indexes"""
    try:
        client = get_mongodb_client()
        # Test connection
        client.admin.command("ping")
        print(f"✓ MongoDB connection successful!")
        
        db = get_database()
        
        # Create indexes for better performance
        db.users.create_index("email", unique=True)
        db.users.create_index("username", unique=True)
        db.expenses.create_index([("user_id", 1), ("date", -1)])
        db.user_activities.create_index([("user_id", 1), ("timestamp", -1)])
        
        print(f"✓ Database '{MONGO_DB}' initialized with indexes")
        return True
    except ConnectionFailure as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False
    except Exception as e:
        print(f"✗ An unexpected error occurred: {e}")
        return False


def close_db():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        _client = None
        print("✓ MongoDB connection closed")
