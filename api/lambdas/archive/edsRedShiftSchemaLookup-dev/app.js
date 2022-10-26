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

app.get('/lookup', function (req, res) {
  // Add your code here
  const searchQuery = req.query.searchquery;

  //Do something when the searchQuery is not null.
  if (searchQuery != null) {
    var params = {
      ClusterIdentifier: 'eds-cluster' /* required */,
      Database: process.env.ENV,
      SecretArn:
        'arn:aws:secretsmanager:eu-west-2:460020530172:secret:Redshift_Data_API_dev-wNVylU',
      Sql: `select  DISTINCT t.table_name from information_schema.columns t where t.table_schema = 'public' and ( LOWER(t.table_name) LIKE LOWER('%${searchQuery}%') or LOWER(t.column_name) LIKE LOWER('%${searchQuery}%')) order by t.table_name`,
    };

    redshiftdata.executeStatement(params, function (err, data) {
      if (err) {
        // an error occurred
        console.log(err, err.stack);
        res.json(err);
      } else res.json(data); // successful response
    });
  } else {
    res.status(400);
    res.json('Query param searchquery is required');
  }
});

app.listen(3000, function () {
  console.log('Lookup works!');
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
