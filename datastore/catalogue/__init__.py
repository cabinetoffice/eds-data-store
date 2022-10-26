import io
import requests
import json
import base64
from flask import Blueprint, render_template, request, session
import pandas as pd
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

        response = requests.get(f"https://api.equality-data-store.cabinetoffice.gov.uk/search?q={query}&options={base64.b64encode(json.dumps(options).encode('utf-8')).decode('utf-8')}")  # https://7tryeqlk85.execute-api.eu-west-2.amazonaws.com/alpha/search?q=
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
            response = requests.get(f"https://api.equality-data-store.cabinetoffice.gov.uk/data?bucket={bucket}&key={key_value}&return_type=csv")
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







    return render_template(
        'catalogue/upload.html',
        form=None,
    )