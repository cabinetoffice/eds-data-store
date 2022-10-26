import json
import secrets_manager
import postgres


def lambda_handler(event, context):
    sql = '''
        SELECT unique_datasources.id, unique_datasources.bucket, unique_datasources.key_value, unique_datasources.s3_path, unique_datasources.upload_filename,
        	normalized_data.id, normalized_data.title, normalized_data.description, normalized_data.measure_title, normalized_data.time_covered,
        	normalized_data.upload_title, normalized_data.filesize, normalized_data.topic, normalized_data.subtopic, normalized_data.lowest_level_of_geography,
        	normalized_data.type_of_statistic, normalized_data.frequency_of_release, normalized_data.classification, normalized_data.characteristics,
        	normalized_data.characteristics_short_names, normalized_data.characteristics_options, normalized_data.area_covered, normalized_data.publisher_code,
        	normalized_data.publisher_name, normalized_data.publisher_abbreviation, normalized_data.publisher_type
        FROM (
        	SELECT id, bucket, key_value, s3_path, upload_filename, ROW_NUMBER() OVER (PARTITION BY key_value, s3_path, upload_filename ORDER BY bucket DESC) AS rownum
        	FROM (
        		SELECT datasource.id, aws_objects.bucket, aws_objects.key_value, datasource.s3_path, datasource.upload_filename
        		FROM "Datasource" AS datasource LEFT JOIN (
        			SELECT bucket, key_value, SUBSTR(REVERSE(SUBSTR(REVERSE(key_value), 0, STRPOS(REVERSE(key_value), '/'))), 0, STRPOS(REVERSE(SUBSTR(REVERSE(key_value), 0, STRPOS(REVERSE(key_value), '/'))), '.')) AS object_name
        			FROM "AWS_Keys"
        		) AS aws_objects ON REPLACE(datasource.s3_path, '_', '-') = REPLACE(aws_objects.object_name, '_', '-')
        		WHERE aws_objects.bucket IS NOT NULL
        	) AS datasources
        ) AS unique_datasources INNER JOIN
        	"Normalized_data" AS normalized_data ON unique_datasources.id = normalized_data.id
        WHERE (unique_datasources.rownum = 1)
    '''

    q = get_querystring(event, 'q')
    if q is not None:
        sql += f" AND (normalized_data.title LIKE '%{postgres.escape_sql(q)}%')"

    options = get_querystring(event, 'options')
    if options is not None:
        where = ''
        options = json.loads(options)
        for option in options:
            field = option['option']
            if field == 'ethnicity_classification': field = ''  # Need to scan data for this field
            if field == 'publisher': field = 'publisher_code'
            if field == 'release_frequency': field = 'frequency_of_release'
            if field != '':
                where += f"(normalized_data.{postgres.escape_sql(field)} = '{postgres.escape_sql(option['value'])}') OR "

        if where != '':
            sql += f" AND ({where[: -4]})"

    credentials = secrets_manager.get_secret('eds-postgresql')
    conn = postgres.db_conn(credentials, database='eds')
    cursor = conn.cursor(cursor_factory=postgres.RealDictCursor)
    cursor.execute(sql)
    results = cursor.fetchall()

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
