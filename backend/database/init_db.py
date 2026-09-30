"""
FitConnect Database Initializer Script
Executes schema.sql and seed.sql against MySQL (or displays command-line instructions)
"""
import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def run_mysql_script(script_name, user="root", password=None, host="localhost", port=3306, db_name="fitconnect_db"):
    script_path = BASE_DIR / script_name
    if not script_path.exists():
        print(f"[Error] SQL script not found: {script_path}")
        return False

    print(f"\n[+] Executing {script_name}...")
    
    # Try using mysql CLI if available
    cmd = ["mysql", "-h", host, "-P", str(port), "-u", user]
    if password:
        cmd.append(f"-p{password}")

    try:
        with open(script_path, "r", encoding="utf-8") as f:
            process = subprocess.run(cmd, stdin=f, capture_output=True, text=True, check=True)
        print(f"[Success] {script_name} executed successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[Notice] MySQL CLI execution exited with code {e.returncode}:")
        if e.stderr:
            print(f"  {e.stderr.strip()}")
        print("\nTip: You can manually run:")
        print(f"  mysql -u {user} -p < \"{script_path}\"")
        return False
    except FileNotFoundError:
        print("[Notice] 'mysql' command not found in current PATH.")
        print(f"Please run the SQL scripts manually inside MySQL Workbench or MySQL CLI:")
        print(f"  1. SOURCE {BASE_DIR / 'schema.sql'};")
        print(f"  2. SOURCE {BASE_DIR / 'seed.sql'};")
        return False

if __name__ == "__main__":
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_pass = os.getenv("MYSQL_PASSWORD", "")
    
    print("=" * 60)
    print("FitConnect — MySQL Database Setup")
    print("=" * 60)
    print(f"Target Database: fitconnect_db")
    print(f"Schema File:     {BASE_DIR / 'schema.sql'}")
    print(f"Seed File:       {BASE_DIR / 'seed.sql'}")
    print("-" * 60)

    # Run schema
    run_mysql_script("schema.sql", user=mysql_user, password=mysql_pass if mysql_pass else None)
    # Run seed
    run_mysql_script("seed.sql", user=mysql_user, password=mysql_pass if mysql_pass else None)
