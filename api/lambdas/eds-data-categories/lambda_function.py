import json
import secrets_manager
import postgres


def lambda_handler(event, context):
    key = get_querystring(event, 'key')
    sql = ''
    if key == 'area_covered':
        sql = 'SELECT id, value FROM "Area_covered" ORDER BY id ASC'
    elif key == 'ethnicity_classification':
        sql = 'SELECT id, title AS value FROM "Classification" ORDER BY id ASC'
    elif key == 'lowest_level_of_geography':
        sql = 'SELECT id, value FROM "Lowest_level_of_geography" ORDER BY id ASC'
    elif key == 'publisher':
        sql = 'SELECT code AS id, name AS value FROM "Publisher" ORDER BY code ASC'
    elif key == 'publisher_type':
        sql = 'SELECT id, value FROM "Publisher_type" ORDER BY id ASC'
    elif key == 'release_frequency':
        sql = 'SELECT id, value FROM "Frequency_of_release" ORDER BY id ASC'
    elif key == 'topic':
        sql = 'SELECT id, value FROM "Topic" ORDER BY id ASC'
    elif key == 'subtopic':
        sql = 'SELECT id, value FROM "Sub_topic" ORDER BY id ASC'
    elif key == 'type_of_statistic':
        sql = 'SELECT id, value FROM "Type_of_statistic" ORDER BY id ASC'
    elif key == 'classification':
        sql = 'SELECT id, title AS value FROM "Classification" ORDER BY id ASC'
    elif key == 'characteristics':
        sql = 'SELECT id, value FROM "Characteristics" ORDER BY id ASC'
    elif key == 'characteristics_options':
        sql = 'SELECT id, value FROM "Characteristics_options" ORDER BY id ASC'
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': f'key {key} not available' })
        }

    credentials = secrets_manager.get_secret('eds-postgresql')
    conn = postgres.db_conn(credentials, database='eds')
    cursor = conn.cursor(cursor_factory=postgres.RealDictCursor)
    cursor.execute(sql)
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
            'Content-Type': 'application/json'
        },
        'body': json.dumps(results)
    }

#lambda_handler(None, None)


def get_querystring(event, key, default_value=None):
    value = default_value
    try:
        if key in event['queryStringParameters']:
            value = event['queryStringParameters'][key]
    except Exception as e:
        pass

    return value
