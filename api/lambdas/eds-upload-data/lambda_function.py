import json
import base64
import urllib
import secrets_manager
import postgres


def lambda_handler(event, context):
    body = base64.b64decode(event['body']).decode('utf-8')
    data = get_post(body)

    # Add data validation

    credentials = secrets_manager.get_secret('eds-postgresql')
    conn = postgres.db_conn(credentials, database='eds')
    cursor = conn.cursor(cursor_factory=postgres.RealDictCursor)

    sql = '''
        INSERT INTO "Datasource"
        (
            id, title, description, topic_id, sub_topic_id, measure_title,
            lowest_level_of_geography_id, type_of_statistic_id, frequency_of_release_id,
            time_covered, upload_title, upload_filename, s3_path, filesize
        )
        VALUES
        (
            (SELECT MAX(id) + 1 FROM "Datasource"), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
    '''
    cursor.execute(sql, (
        get_postvalue(data, 'title', ''),
        get_postvalue(data, 'description', ''),
        int(get_postvalue(data, 'topic_id', 0)),
        int(get_postvalue(data, 'sub_topic_id', 0)),
        get_postvalue(data, 'measure_title', ''),
        int(get_postvalue(data, 'lowest_level_of_geography_id', 0)),
        int(get_postvalue(data, 'type_of_statistic_id', 0)),
        int(get_postvalue(data, 'frequency_of_release_id', 0)),
        get_postvalue(data, 'time_covered', ''),
        get_postvalue(data, 'upload_title', ''),
        get_postvalue(data, 'upload_filename', ''),
        get_postvalue(data, 's3_path', ''),
        int(get_postvalue(data, 'filesize', 0))
    ))
    id = cursor.fetchall()[0]['id']
    conn.commit()


    sql = '''
        INSERT INTO "Datasource_areas_covered"
        (
        	id, datasource_id, area_covered_id
        )
    	VALUES (
    	    (SELECT MAX(id) + 1 FROM "Datasource_areas_covered"), %s, %s
    	)
    '''
    cursor.execute(sql, (
        id,
        int(get_postvalue(data, 'area_covered', 0))
    ))
    conn.commit()


    sql = '''
        INSERT INTO "Datasource_publishers"
        (
        	id, datasource_id, publisher_code
        )
    	VALUES (
    	    (SELECT MAX(id) + 1 FROM "Datasource_publishers"), %s, %s
    	)
    '''
    cursor.execute(sql, (
        id,
        get_postvalue(data, 'publisher', '')
    ))
    conn.commit()


    sql = '''
        INSERT INTO "Datasource_classifications"
        (
        	id, datasource_id, classification_id
        )
    	VALUES (
    	    (SELECT MAX(id) + 1 FROM "Datasource_classifications"), %s, %s
    	)
    '''
    cursor.execute(sql, (
        id,
        get_postvalue(data, 'classification', '')
    ))
    conn.commit()


    sql = '''
        INSERT INTO "Datasource_characteristics"
        (
        	id, datasource_id, characteristics_id
        )
    	VALUES (
    	    (SELECT MAX(id) + 1 FROM "Datasource_characteristics"), %s, %s
    	)
        RETURNING id
    '''
    cursor.execute(sql, (
        id,
        get_postvalue(data, 'characteristics', '')
    ))
    characteristics_id = cursor.fetchall()[0]['id']
    conn.commit()


    sql = '''
        INSERT INTO "Datasource_characteristics_options"
        (
        	id, datasource_characteristics_id, characteristics_options_id
        )
    	VALUES (
    	    (SELECT MAX(id) + 1 FROM "Datasource_characteristics_options"), %s, %s
    	)
    '''
    cursor.execute(sql, (
        characteristics_id,
        int(get_postvalue(data, 'characteristics_options', 0))
    ))
    conn.commit()

    cursor.close()
    conn.close()


    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'id': id
        })
    }


def get_post(body):
    data = {}
    for items in body.split('&'):
        vals = items.split('=')
        data[vals[0]] = urllib.parse.unquote(vals[1])
    return data


def get_postvalue(data, key, default_value=None):
    #data = get_post(body)
    if key in data:
        return data[key]
    return default_value
