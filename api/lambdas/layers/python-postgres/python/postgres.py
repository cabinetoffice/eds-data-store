import psycopg2  # downloaded from https://github.com/jkehler/awslambda-psycopg2
from psycopg2.extras import RealDictCursor
import json


def db_conn(credentials, database='eds'):
    if credentials is None:
        raise 'Error: No DB credentials found'

    credentials = json.loads(credentials)

    return psycopg2.connect(
        host = credentials['host'],
        user = credentials['username'],
        password = credentials['password'],
        database = database
    )


def escape_sql(q):
    return q.replace("'", "''")
