import psycopg2  # downloaded from https://github.com/jkehler/awslambda-psycopg2
from psycopg2.extras import RealDictCursor
import json
import boto3
import base64
from botocore.exceptions import ClientError


def get_secret():
    secret_name = "eds-postgresql"
    region_name = "eu-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        # Decrypts secret using the associated KMS key.
        # Depending on whether the secret is a string or binary, one of these fields will be populated.
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
            return secret
        else:
            decoded_binary_secret = base64.b64decode(get_secret_value_response['SecretBinary'])
            return decoded_binary_secret

    return None
            

def db_conn():
    db = {
        'host': 'equality-data-store-instance-1.ciyx9q7bb8hh.eu-west-2.rds.amazonaws.com',
        'username': 'postgres',
        'password': 't1N5BKna2WhoQC58Eai5OYlOlJtqZ-it',
        'database': 'eds',
    }

    return psycopg2.connect(
        host = db['host'],
        user = db['username'],
        password = db['password'],
        database = db['database']
    )

def lambda_handler(event, context):
    conn = db_conn()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM "Datasource"')
    results = cursor.fetchall()
    #print(json.dumps(results))

    credentials = get_secret()
    return {
        'statusCode': 200,
        'body': json.dumps(results),
        'test': credentials
    }

#lambda_handler(None, None)
