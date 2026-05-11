#!/usr/bin/env python3
from pymongo import MongoClient

client = MongoClient('mongodb://root:root@127.0.0.1:27017/?authSource=admin')
db = client['expense_tracker']

# Check admin user
user = db.users.find_one({'email': 'admin@test.com'})
if user:
    print("✓ Admin user found in database")
    print(f"  Email: {user.get('email')}")
    print(f"  Username: {user.get('username')}")
    print(f"  Is Admin: {user.get('is_admin')}")
    print(f"  Has password hash: {'password' in user and len(user['password']) > 0}")
else:
    print("✗ Admin user NOT found in database")

# List all users
print("\nAll users in database:")
users = list(db.users.find({}, {'email': 1, 'username': 1, 'is_admin': 1}))
for u in users:
    print(f"  - {u.get('email')} ({u.get('username')}) - Admin: {u.get('is_admin', False)}")

client.close()
