#!/usr/bin/env python3
"""
Create or update an admin user in the expense tracker database
Usage: python create_admin.py [email] [username] [password]
"""
import sys
from pymongo import MongoClient
import bcrypt

# MongoDB connection
client = MongoClient('mongodb://root:root@127.0.0.1:27017/?authSource=admin')
db = client['expense_tracker']

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def create_or_update_admin(email: str, username: str = None, password: str = None):
    """Create new admin user or update existing user to admin"""
    
    # Check if user exists
    user = db.users.find_one({'email': email})
    
    if user:
        # Update existing user to admin
        result = db.users.update_one(
            {'email': email},
            {'$set': {'is_admin': True}}
        )
        print(f"✓ Updated existing user to admin: {email}")
        updated_user = db.users.find_one({'email': email})
        print(f"  Email: {updated_user['email']}")
        print(f"  Username: {updated_user['username']}")
        print(f"  Is Admin: {updated_user.get('is_admin', False)}")
    else:
        # Create new admin user
        if not username:
            username = email.split('@')[0]
        if not password:
            password = "TempPassword123!"
        
        hashed_pwd = hash_password(password)
        
        new_user = {
            'email': email,
            'username': username,
            'password_hash': hashed_pwd,
            'is_admin': True
        }
        
        result = db.users.insert_one(new_user)
        print(f"✓ Created new admin user: {email}")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"  User ID: {result.inserted_id}")
    
    client.close()

if __name__ == "__main__":
    # Parse command line arguments
    if len(sys.argv) < 2:
        # Interactive mode
        print("=== Create/Update Admin User ===")
        email = input("Enter email: ").strip()
        
        existing_user = db.users.find_one({'email': email})
        if not existing_user:
            username = input("Enter username (optional, default is email prefix): ").strip()
            password = input("Enter password (optional, default is TempPassword123!): ").strip()
            create_or_update_admin(email, username or None, password or None)
        else:
            create_or_update_admin(email)
    else:
        # Command line mode
        email = sys.argv[1]
        username = sys.argv[2] if len(sys.argv) > 2 else None
        password = sys.argv[3] if len(sys.argv) > 3 else None
        create_or_update_admin(email, username, password)
