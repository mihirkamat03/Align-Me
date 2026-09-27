import psycopg2

try:
    conn = psycopg2.connect(host='127.0.0.1', port=5433, user='postgres', dbname='postgres')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT version()")
    print("SUCCESS! Connected as postgres:", cur.fetchone()[0])
    cur.execute("SELECT 1 FROM pg_database WHERE datname='aether_posture'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE aether_posture")
        print("Database aether_posture created!")
    else:
        print("Database aether_posture already exists!")
    conn.close()
except Exception as e:
    print("Trying user Mihir...", e)
    conn = psycopg2.connect(host='127.0.0.1', port=5433, user='Mihir', dbname='postgres')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT version()")
    print("SUCCESS! Connected as Mihir:", cur.fetchone()[0])
    cur.execute("SELECT 1 FROM pg_database WHERE datname='aether_posture'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE aether_posture")
        print("Database aether_posture created!")
    else:
        print("Database aether_posture already exists!")
    conn.close()
