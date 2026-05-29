import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get('DB_PATH', 'image_encrypt.db')


class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None

    def connect(self):
        try:
            self.connection = sqlite3.connect(DB_PATH)
            self.connection.row_factory = sqlite3.Row  # dict-like rows
            self.connection.execute("PRAGMA journal_mode=WAL")
            self.connection.execute("PRAGMA foreign_keys=ON")
            self.cursor = self.connection.cursor()
            return True
        except sqlite3.Error as e:
            print(f" Database connection error: {e}")
            return False

    def disconnect(self):
        if self.connection:
            self.connection.close()

    def execute_query(self, query, params=None):
        try:
            if not self.connection:
                self.connect()
            # Translate MySQL %s placeholders to SQLite ?
            query = query.replace('%s', '?')
            # Translate MySQL NOW() to SQLite datetime('now')
            query = query.replace('NOW()', "datetime('now')")
            self.cursor.execute(query, params or ())
            self.connection.commit()
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            print(f" Query execution error: {e}")
            self.connection.rollback()
            return None

    def fetch_one(self, query, params=None):
        try:
            if not self.connection:
                self.connect()
            query = query.replace('%s', '?')
            query = query.replace('NOW()', "datetime('now')")
            self.cursor.execute(query, params or ())
            row = self.cursor.fetchone()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f" Fetch error: {e}")
            return None

    def fetch_all(self, query, params=None):
        try:
            if not self.connection:
                self.connect()
            query = query.replace('%s', '?')
            query = query.replace('NOW()', "datetime('now')")
            self.cursor.execute(query, params or ())
            rows = self.cursor.fetchall()
            return [dict(r) for r in rows]
        except sqlite3.Error as e:
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
            db.cursor.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    name      TEXT NOT NULL,
                    email     TEXT NOT NULL UNIQUE,
                    password  TEXT NOT NULL,
                    created_at  DATETIME DEFAULT (datetime('now')),
                    updated_at  DATETIME
                );

                CREATE TABLE IF NOT EXISTS encryption_history (
                    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id             INTEGER NOT NULL,
                    original_filename   TEXT NOT NULL,
                    encrypted_filename  TEXT NOT NULL,
                    encryption_date     DATE NOT NULL,
                    encryption_time     TIME NOT NULL,
                    image_details       TEXT,
                    rsa_key             TEXT NOT NULL,
                    encrypted_file_path TEXT NOT NULL,
                    created_at          DATETIME DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS decryption_logs (
                    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id               INTEGER NOT NULL,
                    encryption_history_id INTEGER,
                    decryption_date       DATE NOT NULL,
                    decryption_time       TIME NOT NULL,
                    success               INTEGER NOT NULL,
                    error_message         TEXT,
                    created_at            DATETIME DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (encryption_history_id) REFERENCES encryption_history(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id  TEXT NOT NULL UNIQUE,
                    user_id     INTEGER NOT NULL,
                    created_at  DATETIME DEFAULT (datetime('now')),
                    expires_at  DATETIME,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
                CREATE INDEX IF NOT EXISTS idx_enc_history_user     ON encryption_history(user_id);
                CREATE INDEX IF NOT EXISTS idx_enc_history_date     ON encryption_history(encryption_date);
                CREATE INDEX IF NOT EXISTS idx_dec_logs_user        ON decryption_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_dec_logs_date        ON decryption_logs(decryption_date);
                CREATE INDEX IF NOT EXISTS idx_sessions_session_id  ON sessions(session_id);
            """)
            db.connection.commit()
            print(" SQLite database initialised successfully")
            db.disconnect()
            return True
        return False
    except Exception as e:
        print(f" Database initialisation error: {e}")
        return False


if __name__ == '__main__':
    print("Testing SQLite database connection...")
    if init_database():
        print(" Database connection successful!")
    else:
        print(" Database connection failed!")
