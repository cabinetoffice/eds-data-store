from io import BytesIO
import awswrangler as wr
import pandas as pd
import zipfile
import base64

def lambda_handler(event, context):
    bucket = get_querystring(event, 'bucket')
    key = get_querystring(event, 'key')

    if bucket is None or key is None:
        return {
            'statusCode': 404,
            'body': 'Data not found'
        }

    #bucket = 'eds-lake-prod'
    ##key = 'public/eff/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_0/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_0.csv'
    #key = 'public/eff/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_0/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_0.csv,public/eff/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_1/11_key_stage_2_grammar_punctuation_and_spelling_attainment_for_children_aged_10_to_11_key_stage_2_local_authorities_v2_1.csv'

    download_type = get_querystring(event, 'download', '').lower()
    return_type = get_querystring(event, 'return_type', 'csv').lower()

    if ',' in key:
        bytes = None
        zip_file_name = 'eds-data.zip'

        try:
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, 'x', zipfile.ZIP_DEFLATED, False) as zipper:
                keys = key.split(',')
                for key in keys:
                    file_name = f'{get_filename(key)}.{return_type}'
                    df = wr.s3.read_csv(path=f's3://{bucket}/{key}')
                    data = get_returndata(download_type, df)
                    if data is not None:
                        zipper.writestr(file_name, data)

            bytes = zip_buffer.getvalue()
            zip_buffer.close()

        except Exception as e:
            print(e)

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': 'application/zip',
                'Content-Disposition': f'attachment; name="{zip_file_name}"; filename="{zip_file_name}"'
            },
            'body': base64.b64encode(bytes).decode('utf-8'),
            'isBase64Encoded': True
        }

    elif download_type != '':
        file_name = get_filename(key)
        df = wr.s3.read_csv(path=f's3://{bucket}/{key}')

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': get_mimetype(download_type),
                'Content-Disposition': f'attachment; name="{file_name}"; filename="{file_name}.{download_type}"'
            },
            'body': get_returndata(download_type, df)
        }

    else:
        df = wr.s3.read_csv(path=f's3://{bucket}/{key}')

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': get_mimetype(return_type)
            },
            'body': get_returndata(return_type, df)
        }


def get_querystring(event, key, default_value=None):
    value = default_value
    try:
        if key in event['queryStringParameters']:
            value = event['queryStringParameters'][key]
    except Exception as e:
        pass

    return value


def get_mimetype(return_type):
    if return_type == 'json':
        return 'application/json'
    else:
        return 'text/csv'


def get_filename(key):
    file_name = key
    if '/' in file_name:
        file_name = file_name[file_name.rindex('/') + 1:]
    if '.' in file_name:
        file_name = file_name[:file_name.rindex('.')]
    return file_name


def get_returndata(return_type, df):
    if return_type == 'json':
        return df.to_json()
    else:
        return df.to_csv()
