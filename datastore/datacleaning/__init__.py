import os
import json
import math
from flask import Blueprint, flash, render_template, request, redirect, Response, url_for, session
from werkzeug.utils import secure_filename
import pandas as pd
from datastore.utils.decorators import DataRequired
from datastore.utils.logger import LogLevel, Logger
from datastore.utils.redirect import local_redirect

datacleaning = Blueprint('datacleaning', __name__)
logger = Logger()

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}


def nan2None(obj):
    if isinstance(obj, dict):
        return {k:nan2None(v) for k,v in obj.items()}
    elif isinstance(obj, list):
        return [nan2None(v) for v in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    return obj


class NanConverter(json.JSONEncoder):
    def default(self, obj):
        # possible other customizations here 
        pass
    def encode(self, obj, *args, **kwargs):
        obj = nan2None(obj)
        return super().encode(obj, *args, **kwargs)
    def iterencode(self, obj, *args, **kwargs):
        obj = nan2None(obj)
        return super().iterencode(obj, *args, **kwargs)


def get_data():
    user_file = ''
    time_covered = ''
    df = None
    if 'file' in session:
        #user_file = session['file']
        ##df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file), header=None).head(num).to_json()
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file)) #.values.tolist()
        file = session['file']

        datasets = session['datasets']
        for row in datasets:
            if str(row['id']) == file:
                user_file = row['upload_title']
                time_covered = row['time_covered']
                break

        df = session[file]
    return user_file, time_covered, df


@datacleaning.route('/datacleaning/', methods=['GET', 'POST'])
def index():
    #form = EmailAddressForm()

    user_file = ''
    if 'file' in session:
        user_file, time_covered, _ = get_data()  # session['file']

    #if form.validate_on_submit():
    #    session.clear()
    def allowed_file(filename):
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            user_file = filename
            session['file'] = user_file
            session['rules'] = []

    data = None
    #if user_file != '':
    #    data = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file)).head().to_html()

    return render_template(
        'datacleaning/datacleaning.html',
        form=None,
        file=user_file,
        upload_title=user_file,
        time_covered=time_covered,
        data=data
    )


@datacleaning.route('/datacleaning/rawdata', methods=['GET'])
@DataRequired
def raw_data():
    df = None
    user_file = ''
    rows = 0
    args_num = request.args.get('num', 5, type=int)
    args_from = request.args.get('from', 1, type=int)
    args_to = request.args.get('to', 5, type=int)

    if 'file' in session:
        #user_file = session['file']
        ##df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file), header=None).head(num).to_json()
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file)) #.values.tolist()
        user_file, time_covered, df = get_data()
        rows = len(df)
        df = df[args_from: args_to] #df[1: args_num + 1]
        data = [list(d) for _, d in df.iterrows()]

    response = Response(
        response=json.dumps({ 'rows': rows, 'data': data }, cls=NanConverter),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/rawdatacolumns', methods=['GET'])
@DataRequired
def raw_data_columns():
    df = None
    user_file = ''
    cols = 0
    all_numeric = []

    if 'file' in session:
        #user_file = session['file']
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file))
        user_file, time_covered, df = get_data()

        data = list(df.columns)
        cols = len(data)
        all_numeric = df.iloc[1: , :].apply(lambda d: pd.to_numeric(d, errors='coerce').notnull().all()).to_list()

    response = Response(
        response=json.dumps({ 'cols': cols, 'all_numeric': all_numeric, 'data': data }),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/stats', methods=['GET'])
@DataRequired
def stats():
    df = None
    user_file = ''
    args_column = request.args.get('column', -1, type=int)

    if 'file' in session and args_column > -1:
        #user_file = session['file']
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file))
        user_file, time_covered, df = get_data()

        col = df.iloc[:, args_column]
        data = list(col.agg(['nunique', 'count', 'size']))
        data = { 'nunique': data[0], 'count': data[1], 'size': data[2], 'unique': sorted(col.unique()) }

        # https://stackoverflow.com/questions/45759966/counting-unique-values-in-a-column-in-pandas-dataframe-like-in-qlik

        response = Response(
            response=json.dumps(data, cls=NanConverter),
            status=200,
            mimetype='application/json'
        )
        return response

    response = Response(
        response=json.dumps({}, cls=NanConverter),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/processeddata', methods=['GET'])
@DataRequired
def data():
    df = None
    user_file = ''
    rows = 0
    args_num = request.args.get('num', 5, type=int)
    args_from = request.args.get('from', 1, type=int)
    args_to = request.args.get('to', 5, type=int)
    if 'file' in session:
        #user_file = session['file']
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file))
        user_file, time_covered, df = get_data()

        try:
            rules = []
            if 'rules' in session:
                rules = session['rules']
                for rule in rules:
                    if rule['active']:
                        if rule['rule'] == 'filter_columns':
                            all_cols = []
                            for col in json.loads(rule['data']):
                                if col['include']:
                                    all_cols.append(col['index'])  # name
                                    if col['new_name'] != col['name']:
                                        df.columns = [col['new_name'] if c==col['name'] else c for c in df.columns]
                            df = df.iloc[:, all_cols]  # df[all_cols]

                        elif rule['rule'] == 'filter_column_values':
                            item = json.loads(rule['data'])
                            values = [v.strip() for v in str(item['value']).split(',')]

                            if item['type'] == 'starts with':
                                #df = df[df[item['name']].str.startswith(tuple(values))]
                                df = df[df.iloc[:, int(item['index'])].str.startswith(tuple(values))]
                            elif item['type'] == 'ends with':
                                #df = df[df[item['name']].str.endswith(tuple(values))]
                                df = df[df.iloc[:, int(item['index'])].str.endswith(tuple(values))]
                            elif item['type'] == 'contains':
                                #df = df[df[item['name']].str.contains('|'.join(values))]
                                df = df[df.iloc[:, int(item['index'])].str.contains('|'.join(values))]
                            elif item['type'] == 'matches':
                                #df = df[df[item['name']].isin(values)]
                                df = df[df.iloc[:, int(item['index'])].isin(values)]

                        elif rule['rule'] == 'harmonise_column_values':
                            item = json.loads(rule['data'])
                            values = {v.strip(): item['with'] for v in str(item['replace']).split(',')}
                            print(values, flush=True)

                            #df[item['name']] = df[item['name']].map(values).fillna(df[item['name']])
                            df.iloc[:, int(item['index'])] = df.iloc[:, int(item['index'])].map(values).fillna(df.iloc[:, int(item['index'])])

                        elif rule['rule'] == 'aggregate':
                            # https://stackoverflow.com/questions/39922986/how-do-i-pandas-group-by-to-get-sum
                            item = json.loads(rule['data'])
                            values = [int(v.strip()) for v in str(item['index']).split(',')]

                            #df.iloc[:, int(item['aggregate'])] = df.iloc[:, int(item['aggregate'])].str.replace(',', '').astype(float)
                            df = df[item['aggregate']] = pd.to_numeric(df[item['aggregate']])
                            df = df.groupby(df.iloc[:, int(item['index'])])[df.columns[int(item['aggregate'])]].agg(item['action']).reset_index()
                            #df = df.groupby(values).agg({ item['aggregate']: item['action'] })

            rows = len(df)
            df = df[args_from: args_to] #df[1: args_num + 1]
            data = [list(d) for _, d in df.iterrows()]

        except Exception as e:
            print(e, flush=True)

    response = Response(
        response=json.dumps({ 'rows': rows, 'data': data }, cls=NanConverter),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/processeddatacolumns', methods=['GET'])
@DataRequired
def data_columns():
    df = None
    user_file = ''
    cols = 0
    all_numeric = []
    if 'file' in session:
        rules = []
        rules_applied = False
        if 'rules' in session:
            rules = session['rules']
            all_cols = []
            for rule in rules:
                if rule['active']:
                    if rule['rule'] == 'filter_columns':
                        all_cols = []
                        rules_applied = True
                        for col in json.loads(rule['data']):
                            if col['include']:
                                all_cols.append(col['new_name'] if col['new_name'] != '' else '')

                    elif rule['rule'] == 'aggregate':
                        all_cols = [v.strip() for v in str(json.loads(rule['data'])['name']).split(',')]
                        all_cols.append(json.loads(rule['data'])['aggregate_name'])
                        rules_applied = True

            if rules_applied:
                response = Response(
                    response=json.dumps({ 'cols': len(all_cols), 'all_numeric': all_cols, 'data': all_cols }),
                    status=200,
                    mimetype='application/json'
                )
                return response

        #user_file = session['file']
        #df = pd.read_csv(os.path.join(UPLOAD_FOLDER, user_file))
        user_file, time_covered, df = get_data()

        data = list(df.columns)
        cols = len(data)
        all_numeric = df.iloc[1: , :].apply(lambda d: pd.to_numeric(d, errors='coerce').notnull().all()).to_list()

    response = Response(
        response=json.dumps({ 'cols': cols, 'all_numeric': all_numeric, 'data': data }),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/addrule', methods=['POST'])
@DataRequired
def add_rule():
    rule = request.form.get('rule')
    data = request.form.get('data')
    rules = []
    if 'rules' in session:
        rules = session['rules']
    rules.append({ 'rule': rule, 'data': data, 'active': True })
    session['rules'] = rules

    response = Response(
        response=json.dumps({}),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/deleterule', methods=['POST'])
@DataRequired
def delete_rule():
    position = request.form.get('position', -1, type=int)
    rules = []
    if 'rules' in session:
        rules = session['rules']

    if position > -1 and len(rules) >= position:
        rules.pop(position)
        session['rules'] = rules

    response = Response(
        response=json.dumps({}),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/activaterule', methods=['POST'])
@DataRequired
def activate_rule():
    position = request.form.get('position', -1, type=int)
    rules = []
    if 'rules' in session:
        rules = session['rules']

    if position > -1 and len(rules) >= position:
        rules[position]['active'] = True
        session['rules'] = rules

    response = Response(
        response=json.dumps({}),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/deactivaterule', methods=['POST'])
@DataRequired
def deactivate_rule():
    position = request.form.get('position', -1, type=int)
    rules = []
    if 'rules' in session:
        rules = session['rules']

    if position > -1 and len(rules) >= position:
        rules[position]['active'] = False
        session['rules'] = rules

    response = Response(
        response=json.dumps({}),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/listrules', methods=['GET'])
@DataRequired
def list_rules():
    response = Response(
        response=json.dumps(session['rules']),
        status=200,
        mimetype='application/json'
    )
    return response


@datacleaning.route('/datacleaning/clearsession', methods=['GET'])
def clearsession():
    session.clear()
    return local_redirect(url_for('datacleaning.index'))
