import io
import requests
import json
import base64
import pandas as pd
from flask import Blueprint, current_app, render_template, request, session
import boto3
from botocore.client import Config
from werkzeug.utils import secure_filename
from datastore.catalogue.forms import UploadForm
from datastore.utils.logger import LogLevel, Logger

api = Blueprint('api', __name__)
logger = Logger()


@api.route('/', methods=['GET', 'POST'])
def index():
    query = ''
    data = None
    options = []

    if request.method == 'POST':
        query = request.form['query']
        for field, value in request.form.items():
            if field[: 7] == 'options':
                options.append({ 'option': value, 'value': request.form[f'values{field[7: ]}'] })

        response = requests.get(f"{current_app.config['API_URL']}/search?q={query}&options={base64.b64encode(json.dumps(options).encode('utf-8')).decode('utf-8')}")  # https://7tryeqlk85.execute-api.eu-west-2.amazonaws.com/alpha/search?q=
        data = response.text
        data = json.loads(data)
        session['datasets'] = data

    return render_template(
        'catalogue/catalogue.html',
        form=None,
        query=query,
        data=data,
        options=options
    )


@api.route('/viewdata/<file>', methods=['GET', 'POST'])
def viewData(file: str):
    data = None
    columns = None
    bucket = ''
    key_value = ''
    upload_title = ''
    time_covered = ''

    session['file'] = file
    if file in session and 1==2:
        data = session[file]
    else:
        if 'datasets' in session:
            datasets = session['datasets']
            for row in datasets:
                if str(row['id']) == file:
                    bucket = row['bucket']
                    key_value = row['key_value']
                    upload_title = row['upload_title']
                    time_covered = row['time_covered']
                    break

        elif request.method == 'POST':
            bucket = request.form['bucket']
            key_value = request.form['key_value']

        print(f'bucket: {bucket}', flush=True)
        print(f'key_value: {key_value}', flush=True)
        print(f'upload_title: {upload_title}', flush=True)

        if bucket != '' and key_value != '':
            response = requests.get(f"{current_app.config['API_URL']}/data?bucket={bucket}&key={key_value}&return_type=csv")
            data = response.text
            data = pd.read_csv(io.StringIO(data))
            session[file] = data
            columns = data.columns.tolist()
            data = data.values.tolist()

    return render_template(
        'catalogue/viewdata.html',
        form=None,
        file=file,
        bucket=bucket,
        key_value=key_value,
        upload_title=upload_title,
        time_covered=time_covered,
        columns=columns,
        data=data
    )


@api.route('/upload', methods=['GET', 'POST'])
def upload():
    form = UploadForm()

    if form.validate_on_submit():
        s3 = boto3.client(
            's3',
            aws_access_key_id=current_app.config['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=current_app.config['AWS_SECRET_ACCESS_KEY'],
            region_name=current_app.config['AWS_REGION'],
            config=Config(signature_version='s3v4')
        )

        for document in request.files.getlist('file'):
            original_file_name = secure_filename(document.filename)
            url = s3.generate_presigned_url(
                ClientMethod='put_object',
                Params={'Bucket': current_app.config['AWS_BUCKET_NAME'], 'Key': original_file_name},
                ExpiresIn=1000
            )

            try:
                # TODO - check if file exists
                response = requests.put(url, data=document)
            except FileNotFoundError:
                print(f"ERROR.", flush=True)

            if response is not None:
                if response.status_code == 200:
                    document.seek(0)
                    file_size = len(document.read())

                    data = {
                        'title': form.title.data,
                        'description': form.description.data,
                        'topic_id': int(form.topic.data),
                        'sub_topic_id': int(form.subtopic.data),
                        'measure_title': form.measure_title.data,
                        'area_covered': form.area_covered.data,
                        'lowest_level_of_geography_id': int(form.lowest_level_of_geography.data),
                        'type_of_statistic_id': int(form.type_of_statistic.data),
                        'frequency_of_release_id': int(form.release_frequency.data),
                        'time_covered': form.time_covered.data,
                        'publisher': form.publisher.data,
                        'publisher_type': form.publisher_type.data,
                        'classification': form.classification.data,
                        'characteristics': form.characteristics.data,
                        'characteristics_options': form.characteristics_options.data,
                        'upload_title': form.title.data,
                        'upload_filename': original_file_name,
                        's3_path': '',
                        'filesize': file_size
                    }
                    response = requests.post(f"{current_app.config['API_URL']}/upload", data=data)

    return render_template(
        'catalogue/upload.html',
        form=form,
    )
