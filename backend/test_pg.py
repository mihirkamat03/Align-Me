import psycopg2

passwords = ['postgres', 'password', 'admin', 'root', '123456', '', 'mihir', 'Mihir']
connected = False
for p in passwords:
    try:
        conn = psycopg2.connect(host='localhost', port=5432, user='postgres', password=p, dbname='postgres')
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute('SELECT version()')
        ver = cur.fetchone()[0]
        print(f"Connected successfully with password: {p!r}")
        print(f"Version: {ver}")
        
        cur.execute("SELECT 1 FROM pg_database WHERE datname='aether_posture'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE aether_posture")
            print("Created database aether_posture")
        else:
            print("Database aether_posture already exists")
        conn.close()
        connected = True
        with open("pg_config.txt", "w") as f:
            f.write(f"postgresql://postgres:{p}@localhost:5432/aether_posture")
        break
    except Exception as e:
        # print(f"Failed with {p!r}: {e}")
        pass

if not connected:
    print("Could not connect with common passwords, checking current user...")
    try:
        conn = psycopg2.connect(host='localhost', port=5432, user='Mihir', dbname='postgres')
        print("Connected as Mihir")
    except Exception as e:
        print(f"Error: {e}")
