import psycopg2

conn = psycopg2.connect('postgresql://postgres@localhost:5433/aether_posture')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
print("Tables in PostgreSQL 18:", [r[0] for r in cur.fetchall()])
cur.execute("SELECT count(*) FROM sessions")
print("Sessions in Postgres:", cur.fetchone()[0])
cur.execute("SELECT count(*) FROM posture_events")
print("Posture episodes in Postgres:", cur.fetchone()[0])
cur.execute("SELECT count(*) FROM posture_metrics")
print("Posture metrics in Postgres:", cur.fetchone()[0])
conn.close()
