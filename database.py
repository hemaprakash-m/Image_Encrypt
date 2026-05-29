import mysql.connector
from mysql.connector import Error
import os
from contextlib import contextmanager

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''), 
    'database': os.environ.get('DB_NAME', 'image_encrypt'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'charset': 'utf8'

}


class Database:    
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                print(f" Connected to MySQL database: {DB_CONFIG['database']}")
                return True
        except Error as e:
            print(f" Database connection error: {e}")
            return False
    
    def disconnect(self):
        if self.connection and self.connection.is_connected():
            if self.cursor:
                self.cursor.close()
            self.connection.close()
            print(" Database connection closed")
    
    def execute_query(self, query, params=None):
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            
            self.cursor.execute(query, params or ())
            self.connection.commit()
            return self.cursor.lastrowid
        except Error as e:
            print(f" Query execution error: {e}")
            self.connection.rollback()
            return None
    
    def fetch_one(self, query, params=None):
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            
            self.cursor.execute(query, params or ())
            return self.cursor.fetchone()
        except Error as e:
            print(f" Fetch error: {e}")
            return None
    
    def fetch_all(self, query, params=None):
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            
            self.cursor.execute(query, params or ())
            return self.cursor.fetchall()
        except Error as e:
            print(f" Fetch error: {e}")
            return []


@contextmanager
def get_db():
    db = Database()
    db.connect()
    try:
        yield db
    finally:
        db.disconnect()


def init_database():
    try:
        db = Database()
        if db.connect():
            # Check if tables exist
            query = """
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'users'
            """
            result = db.fetch_one(query, (DB_CONFIG['database'],))
            
            if result and result['count'] > 0:
                print(" Database tables verified")
                db.disconnect()
                return True
            else:
                print("  Database tables not found. Please run schema.sql")
                db.disconnect()
                return False
        return False
    except Exception as e:
        print(f" Database initialization error: {e}")
        return False


if __name__ == '__main__':
    print("Testing database connection...")
    if init_database():
        print(" Database connection successful!")
        
    else:
        print(" Database connection failed!")

