#!/bin/bash

#pip install rpy2

flask db init
flask db migrate
flask db upgrade

waitress-serve --call 'datastore:create_app'