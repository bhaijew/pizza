import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'FloDesktop', 'flo.db'))
print(f"Opening SQLite database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file does not exist yet.")
    exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("DELETE FROM users WHERE id IN ('user-1', 'user-2', 'user-3', 'user-4') OR email LIKE '%@flo.local'")
    conn.commit()
    print(f"Purged {cursor.rowcount} dummy user records.")

    cursor.execute("SELECT id, name, role, pin, is_active FROM users")
    users = cursor.fetchall()
    print("Current SQLite users:")
    for u in users:
        print(f"  ID: {u[0]} | Name: {u[1]} | Role: {u[2]} | PIN: {u[3]} | Active: {u[4]}")
except Exception as e:
    print(f"Error querying/updating database: {e}")
finally:
    conn.close()
