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

const schema_name = `eds_${process.env.ENV}_cleaned`;

/**********************
 * Example get method *
 **********************/

app.get('/search-dataset/:dataset', function (req, res) {
  // Add your code here
  var tableName = req.params.dataset;

  let whereClause = '';
  let orderClause = '';

  if (Object.keys(req.query).length !== 0) {
    whereClause += `WHERE `;
    orderClause = `ORDER BY `;

    let andClause = '';
    let orderComma = ''

    for (const key in req.query) {
      if (req.query[key]) {
        let likeString = req.query[key].replace('%plus%', '+');
        whereClause += ` ${andClause}LOWER(${tableName}.${key}) LIKE LOWER('%${likeString}%')`;
        orderClause += `${orderComma}${tableName}.${key} ASC`
        andClause = ' AND ';
        orderComma = ',';
      }
    }
  }

  //Do something when the searchQuery is not null.
  if (tableName != null) {
    var params = {
      ClusterIdentifier: 'eds-cluster' /* required */,
      Database: process.env.ENV,
      SecretArn:
        'arn:aws:secretsmanager:eu-west-2:460020530172:secret:Redshift_Data_API_dev-wNVylU',
      Sql: `select * from ${schema_name}.${tableName} ${whereClause} ${orderClause} LIMIT 10`,
    };

    redshiftdata.executeStatement(params, function (err, data) {
      if (err) {
        // an error occurred
        console.log(err, err.stack);
        res.json(err);
      } else res.json(data);
    });
  } else {
    res.status(400);
    res.json('Query param searchquery is required');
  }
});

app.listen(3000, function () {
  console.log('Search dataset started');
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
