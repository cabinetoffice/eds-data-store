from flask_wtf import FlaskForm
from wtforms import MultipleFileField, StringField
from wtforms.validators import DataRequired
from datastore.utils.form_custom_validators import MultiFileAllowed, fileSizeLimit


class UploadForm(FlaskForm):
    file = MultipleFileField(
        validators=[
            DataRequired(message='Select a CSV file to upload'),
            MultiFileAllowed(['csv'], message='Select a CSV file to upload'),
            fileSizeLimit(10)
        ]
    )

    title = StringField(
        validators=[DataRequired(message='Title is required')]
    )

    description = StringField(
        validators=[DataRequired(message='Description is required')]
    )

    measure_title = StringField(
        validators=[DataRequired(message='Measure title is required')]
    )

    area_covered = StringField(
        validators=[DataRequired(message='Area covered is required')]
    )

    lowest_level_of_geography = StringField(
        validators=[DataRequired(message='Lowest level of geography is required')]
    )

    publisher = StringField(
        validators=[DataRequired(message='Publisher is required')]
    )

    publisher_type = StringField(
        validators=[DataRequired(message='Publisher type is required')]
    )

    release_frequency = StringField(
        validators=[DataRequired(message='Frequency of release is required')]
    )

    topic = StringField(
        validators=[DataRequired(message='Topic is required')]
    )

    subtopic = StringField(
        validators=[DataRequired(message='Sub topic is required')]
    )

    type_of_statistic = StringField(
        validators=[DataRequired(message='Type of statistic is required')]
    )

    time_covered = StringField(
        validators=[DataRequired(message='Time covered is required')]
    )

    classification = StringField(
        validators=[DataRequired(message='Classification is required')]
    )

    characteristics = StringField(
        validators=[DataRequired(message='Characteristics are required')]
    )

    characteristics_options = StringField(
        validators=[DataRequired(message='Characteristics options are required')]
    )
