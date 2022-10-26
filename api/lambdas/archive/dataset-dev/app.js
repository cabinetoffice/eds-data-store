/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




var express = require('express');
var bodyParser = require('body-parser');
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

// Load the AWS SDK
var AWS = require('aws-sdk'),
  region = 'eu-west-2',
  secretName = 'Redshift_Data_API_dev',
  secret,
  decodedBinarySecret;

var redshiftdata = new AWS.RedshiftData();

// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

var getTableParams = {
  ClusterIdentifier: 'eds-cluster',
  Database: process.env.ENV,
  SecretArn:
    'arn:aws:secretsmanager:eu-west-2:460020530172:secret:Redshift_Data_API_dev-wNVylU',
  Sql: '',
};

app.get('/dataset', function(req, res) {
  const tableName = req.query.name;

  getTableParams.Sql = `select * from ${tableName}`;
  if (tableName != null) {
    redshiftdata.executeStatement(getTableParams, function (err, data) {
      if (err) {
        // an error occurred
        console.log(err, err.stack);
        res.json(err);
      } else res.json(data); // successful response
    });
  } else {
    res.status(400);
    res.json('Name query param is required');
  }
});

app.listen(3000, function() {
    console.log("Get dataset works")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
