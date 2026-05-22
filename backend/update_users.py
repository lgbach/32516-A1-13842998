#!/usr/bin/env python3
"""
Update user roles: demote giabach1532 to normal user and create new admin
"""
from pymongo import MongoClient
import bcrypt

# MongoDB connection
client = MongoClient('mongodb://root:root@127.0.0.1:27017/?authSource=admin')
db = client['expense_tracker']

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

print("=== Updating User Roles ===\n")

print("1. Demoting giabach1532 to normal user...")
result = db.users.update_one(
    {'email': 'giabach1532@gmail.com'},
    {'$set': {'is_admin': False}}
)

if result.matched_count > 0:
    print("   ✓ Successfully changed giabach1532 to normal user")
    user = db.users.find_one({'email': 'giabach1532@gmail.com'})
    print(f"   - Email: {user['email']}")
    print(f"   - Username: {user['username']}")
    print(f"   - Is Admin: {user.get('is_admin', False)}")
else:
    print("   ✗ User giabach1532@gmail.com not found")

print()

# 2. Create new admin user
print("2. Creating new admin user...")
existing_admin = db.users.find_one({'email': 'admin@test.com'})

if existing_admin:
    # Update existing user
    result = db.users.update_one(
        {'email': 'admin@test.com'},
        {'$set': {
            'username': 'administrator',
            'password_hash': hash_password('admin123'),
            'is_admin': True
        }}
    )
    print("   ✓ Updated existing user to admin")
else:
    # Create new admin
    new_admin = {
        'email': 'admin@test.com',
        'username': 'administrator',
        'password_hash': hash_password('admin123'),
        'is_admin': True
    }
    result = db.users.insert_one(new_admin)
    print("   ✓ Created new admin user")

admin_user = db.users.find_one({'email': 'admin@test.com'})
print(f"   - Email: {admin_user['email']}")
print(f"   - Username: {admin_user['username']}")
print(f"   - Password: admin123")
print(f"   - Is Admin: {admin_user.get('is_admin', False)}")

print("\n=== Update Complete ===")

client.close()
