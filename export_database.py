"""
Database Export Script - Export MongoDB collections to JSON
"""

import json
import os
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB ObjectId and datetime"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def export_database():
    """Export all collections from MongoDB to JSON files"""
    
    # MongoDB connection details
    MONGO_USER = "root"
    MONGO_PASSWORD = "root"
    MONGO_HOST = "127.0.0.1"
    MONGO_PORT = 27017
    MONGO_DB = "expense_tracker"
    MONGO_AUTH_SOURCE = "admin"
    
    # Create export directory if it doesn't exist
    export_dir = "database_export"
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
    
    # Connect to MongoDB
    connection_string = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource={MONGO_AUTH_SOURCE}"
    
    try:
        client = MongoClient(connection_string)
        db = client[MONGO_DB]
        
        # Get list of all collections
        collections = db.list_collection_names()
        
        if not collections:
            print("No collections found in database!")
            return
        
        print(f"Exporting {len(collections)} collection(s) from '{MONGO_DB}' database...")
        print(f"Export directory: {os.path.abspath(export_dir)}\n")
        
        # Export each collection
        for collection_name in collections:
            collection = db[collection_name]
            documents = list(collection.find())
            
            # Create JSON file
            filepath = os.path.join(export_dir, f"{collection_name}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(documents, f, indent=2, cls=DateTimeEncoder)
            
            print(f"✓ Exported '{collection_name}': {len(documents)} documents")
            print(f"  → {filepath}\n")
        
        # Create metadata file
        metadata = {
            "database": MONGO_DB,
            "exported_at": datetime.now().isoformat(),
            "collections": {
                coll: db[coll].count_documents({})
                for coll in collections
            }
        }
        
        metadata_path = os.path.join(export_dir, "_metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✓ Metadata file created: {metadata_path}\n")
        print("=" * 60)
        print("Database export completed successfully!")
        print(f"All files are in: {os.path.abspath(export_dir)}")
        print("=" * 60)
        
        client.close()
        
    except Exception as e:
        print(f"Error exporting database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    export_database()
