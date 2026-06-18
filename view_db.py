import sqlite3

def main():
    db_path = "backend/local_db.db"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]
        
        print("\n=== DATABASE TABLES ===")
        print(", ".join(tables) if tables else "No tables found.")
        
        # 2. Users
        if "users" in tables:
            print("\n=== REGISTERED USERS ===")
            cursor.execute("SELECT email, full_name, created_at FROM users;")
            users = cursor.fetchall()
            for u in users:
                print(f"Email: {u[0]} | Name: {u[1]} | Created: {u[2]}")
            if not users:
                print("No users found.")
                
        # 3. Startup Ideas
        if "startup_ideas" in tables:
            print("\n=== STARTUP IDEAS ===")
            cursor.execute("SELECT id, name, industry, business_type, created_at FROM startup_ideas;")
            ideas = cursor.fetchall()
            for idea in ideas:
                # Check if there is an associated score
                has_scores = False
                if "startup_scores" in tables:
                    cursor.execute("SELECT viability_score FROM startup_scores WHERE startup_idea_id = ?;", (idea[0],))
                    score = cursor.fetchone()
                    if score:
                        has_scores = f"{score[0]}%"
                
                score_str = f" | Score: {has_scores}" if has_scores else " | Score: Not Evaluated"
                print(f"Name: {idea[1]} | Industry: {idea[2]} | Model: {idea[3]}{score_str} | Date: {idea[4]}")
            if not ideas:
                print("No ideas found.")
                
        print("\n=======================")
        conn.close()
    except Exception as e:
        print(f"Error reading database: {str(e)}")

if __name__ == "__main__":
    main()
