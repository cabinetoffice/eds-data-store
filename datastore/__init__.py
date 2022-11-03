import json
import os
from datetime import timedelta
from flask import Flask, g, session
from flask_migrate import Migrate
from flask_uuid import FlaskUUID
#from flask_session import Session
#import redis
from datastore.models import db
from datastore.utils import filters
from datastore.config import Config, DevConfig, TestConfig
from datastore.utils.http_basic_authentication import HttpBasicAuthentication
from datastore.utils.maintenance_mode import Maintenance
from datastore.utils.custom_error_handlers import CustomErrorHandlers

migrate = Migrate()
flask_uuid = FlaskUUID()


def create_app(test_config=None):

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    if os.environ['FLASK_ENV'] == 'production':
        config_object = Config
    elif os.environ['FLASK_ENV'] == 'development':
        config_object = DevConfig
    else:
        config_object = TestConfig
    config_object = DevConfig

    app.config.from_object(config_object)

    if os.environ['FLASK_ENV'] != 'development':
        CustomErrorHandlers(app)


    ## Configure Redis for storing the session data on the server-side
    #if app.config['REDIS_HOST'] and app.config['REDIS_PORT'] is not None:
    #    app.config['SESSION_TYPE'] = 'redis'
    #    app.config['SESSION_PERMANENT'] = False
    #    app.config['SESSION_USE_SIGNER'] = True
    #    app.config['SESSION_REDIS'] = redis.from_url(f"redis://{app.config['REDIS_HOST']}:{app.config['REDIS_PORT']}")

    #    # Create and initialize the Flask-Session object AFTER `app` has been configured
    #    server_session = Session(app)

    # Show "Service unavailable" page if the config setting it set
    if app.config['MAINTENANCE_MODE'] == 'ON':
        Maintenance(app)
        return app

    # Require HTTP Basic Authentication if both the username and password are set
    if app.config['BASIC_AUTH_USERNAME'] and app.config['BASIC_AUTH_PASSWORD']:
        HttpBasicAuthentication(app)

    # Load build info from JSON file
    f = open('build-info.json')
    build_info_string = f.read()
    f.close()
    build_info = json.loads(build_info_string)

    # Database
    db.init_app(app)
    migrate.init_app(app, db)

    flask_uuid.init_app(app)

    # Update session timeout time
    @app.before_request
    def make_before_request():
        app.permanent_session_lifetime = timedelta(hours=3)
        g.build_info = build_info

    @app.after_request
    def add_header(response):
        response.headers['X-Frame-Options'] = 'deny'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Content-Security-Policy'] = "default-src 'self'; " \
                                                        "script-src 'self' 'unsafe-inline'; " \
                                                        "script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://code.jquery.com https://d3js.org; " \
                                                        "script-src-attr 'self' 'unsafe-inline'; " \
                                                        "style-src 'self' 'unsafe-inline'; " \
                                                        "img-src 'self'; " \
                                                        "font-src 'self'; " \
                                                        "connect-src 'self' https://*.google-analytics.com https://api.equality-data-store.cabinetoffice.gov.uk; " \
                                                        f"form-action 'self' https://www.payments.service.gov.uk;"

        return response

    # Filters
    app.register_blueprint(filters.blueprint)

    # Catalogue
    from datastore.catalogue import api
    app.register_blueprint(api)

    # Data cleaning
    from datastore.datacleaning import datacleaning
    app.register_blueprint(datacleaning)

    # Policies
    from datastore.policies import policies
    app.register_blueprint(policies)

    return app
