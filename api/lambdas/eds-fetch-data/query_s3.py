import boto3

def lambda_handler(event, context):

    #all_buckets1 = ['amplify-eds-dev-105958-deployment', \
    #                'amplify-eds-prod-135624-deployment', \
    #                'amplify-equalitydataprogramm-dev-111529-deployment', \
    #                'amplify-equalitydataprogramm-prod-121014-deployment', \
    #                'aws-athena-query-results-eu-west-2-460020530172']

    #all_buckets2 = ['aws-glue-scripts-460020530172-eu-west-2', \
    #                'aws-glue-temporary-460020530172-eu-west-2', \
    #                'disability-facts-and-figures-uploads', \
    #                'docs.ethnicity-facts-figures.service.gov.uk', \
    #                'eds-documentation']

    #all_buckets3a = ['eds-lake-dev', \
    #                'eds-lake-prod']

    all_buckets3b = ['ethinicity-facts-and-figures-logs-frankfurt', \
                    'ethinicity-facts-and-figures-logs-ireland', \
                    'ethinicity-facts-and-figures-logs-london']

    all_buckets4a = ['ethinicity-facts-and-figures-production-ireland', 
                    'ethinicity-facts-and-figures-production-london']#, \
    #                'ethnicity-facts-and-figures-production-error-pages']

    all_buckets4b = ['ethnicity-facts-and-figures-staging', \
                    'ethnicity-facts-and-figures-staging-error-pages', \
                    'ethnicity-facts-and-figures-terraform']

    #all_buckets5 = ['guide.ethnicity-facts-figures.service.gov.uk', \
    #                'rd-cms-dev-static', \
    #                'rd-cms-dev-uploads', \
    #                'rd-cms-prod-uploads', \
    #                'rd-cms-staging-uploads', \
    #                'rdu-lake-db']

    all_keys = []
    s3 = boto3.client('s3')

    buckets = ['ethnicity-facts-and-figures-staging']
    for bucket in buckets:
        print(bucket)
        keys = s3.list_objects(Bucket=bucket)
        if 'Contents' in keys:
            for key in keys['Contents']:
                all_keys.append(f"{bucket}|{key['Key']}")

    ''' TIMEOUTS...., used the code abve to list objects in individual buckets
    buckets = s3.list_buckets()
    if 'Buckets' in buckets:
        for bucket in buckets['Buckets']:
            print(bucket['Name'])
            keys = s3.list_objects(Bucket=bucket['Name'])
            if 'Contents' in keys:
                for key in keys['Contents']:
                    all_keys.append(f"{bucket['Name']}|{key['Key']}")'''

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': all_keys #df.to_json()
    }


'''
import boto3

def list_my_buckets(event, context):
    ''s3 = boto3.resource('s3')
    bucketlist = []
    for bucket in s3.buckets.all():
        bucketlist.append(bucket.name)

    return {
        "statusCode": 200,
        "body": bucketlist
    }''

    s3 = boto3.client('s3')
    S3_BUCKET = 'aws-athena-query-results-eu-west-2-460020530172'
    object_key = '0479f982-fd10-476a-a8fa-496cc287bab7.csv'
    data = s3.get_object(Bucket=S3_BUCKET, Key=object_key)['Body'].read()
    print(data)
'''



