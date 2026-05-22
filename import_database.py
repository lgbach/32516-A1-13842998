"""
Database Import Script - Restore MongoDB collections from JSON exports
"""

import json
import os
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime

def parse_extended_json(obj):
    """Convert MongoDB extended JSON format back to Python objects"""
    if isinstance(obj, dict):
        if "$oid" in obj:
            return ObjectId(obj["$oid"])
        elif "$date" in obj:
            if isinstance(obj["$date"], dict) and "$numberLong" in obj["$date"]:
                timestamp = int(obj["$date"]["$numberLong"]) / 1000
                return datetime.fromtimestamp(timestamp)
            else:
                return datetime.fromisoformat(obj["$date"])
        else:
            return {k: parse_extended_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [parse_extended_json(item) for item in obj]
    else:
        return obj

def import_database():
    """Import all collections from JSON files to MongoDB"""
    
    # MongoDB connection details
    MONGO_USER = "root"
    MONGO_PASSWORD = "root"
    MONGO_HOST = "127.0.0.1"
    MONGO_PORT = 27017
    MONGO_DB = "expense_tracker"
    MONGO_AUTH_SOURCE = "admin"
    
    export_dir = "database_export"
    
    # Check if export directory exists
    if not os.path.exists(export_dir):
        print(f"Error: '{export_dir}' directory not found!")
        print(f"Make sure you're in the correct directory and the database_export folder exists.")
        return False
    
    # Connect to MongoDB
    connection_string = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource={MONGO_AUTH_SOURCE}"
    
    try:
        client = MongoClient(connection_string)
        db = client[MONGO_DB]
        
        print(f"Connected to MongoDB at {MONGO_HOST}:{MONGO_PORT}")
        print(f"Database: {MONGO_DB}\n")
        
        # Collections to import (excluding metadata)
        collections = [
            ("users.json", "users"),
            ("expenses.json", "expenses"),
            ("user_activities.json", "user_activities"),
        ]
        
        total_imported = 0
        
        for filename, collection_name in collections:
            filepath = os.path.join(export_dir, filename)
            
            if not os.path.exists(filepath):
                print(f"⚠ Skipping '{collection_name}': {filename} not found")
                continue
            
            # Read JSON file
            with open(filepath, 'r', encoding='utf-8') as f:
                documents = json.load(f)
            
            if not documents:
                print(f"✓ Skipping '{collection_name}': No documents to import")
                continue
            
            # Clear existing collection
            collection = db[collection_name]
            deleted_count = collection.delete_many({}).deleted_count
            
            # Parse extended JSON and insert documents
            parsed_docs = [parse_extended_json(doc) for doc in documents]
            result = collection.insert_many(parsed_docs)
            
            print(f"✓ Imported '{collection_name}':")
            print(f"  - Deleted: {deleted_count} old documents")
            print(f"  - Inserted: {len(result.inserted_ids)} new documents\n")
            
            total_imported += len(result.inserted_ids)
        
        print("=" * 60)
        print(f"Database import completed!")
        print(f"Total documents imported: {total_imported}")
        print("=" * 60)
        
        client.close()
        
        return True
        
    except Exception as e:
        print(f"Error importing database: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MongoDB Database Import Utility")
    print("=" * 60 + "\n")
    
    success = import_database()
    
    if not success:
        exit(1)
