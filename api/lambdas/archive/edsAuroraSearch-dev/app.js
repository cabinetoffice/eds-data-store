/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

// Load the AWS SDK
var AWS = require('aws-sdk'),
  region = 'eu-west-2';

const {
  RDSDataClient,
  ExecuteStatementCommand,
} = require('@aws-sdk/client-rds-data');

var express = require('express');
var bodyParser = require('body-parser');
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

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

/**********************
 * Example get method *
 **********************/

app.get('/search', function (req, res) {
  // Add your code here

  if (req.query.searchterm || req.query) {
    // let searchTerm = req.query.searchterm;

    // let whereClause = `WHERE `;
    // let orderClause = '';

    // if (searchTerm) {
    //   whereClause += ` (LOWER(title) LIKE LOWER('%${searchTerm}%')
    //   OR LOWER(description) LIKE LOWER('%${searchTerm}%')
    //   OR LOWER(measure_title) LIKE LOWER('%${searchTerm}%')
    //   OR LOWER(upload_title) LIKE LOWER('%${searchTerm}%')
    //   OR LOWER(upload_filename) LIKE LOWER('%${searchTerm}%')`;


    // //   OR LOWER(topic) LIKE LOWER('%${searchTerm}%')
    // //   OR LOWER(subtopic) LIKE LOWER('%${searchTerm}%')
    // //   OR LOWER(dimension) LIKE LOWER('%${searchTerm}%')
    // //   OR LOWER(classification) LIKE LOWER('%${searchTerm}%')
    // //   OR LOWER(type_of_statistic) LIKE LOWER('%${searchTerm}%')
    // }

    // // Use foreign keys

    // if (Object.keys(req.query).length !== 0) {
    //   let andClause = searchTerm ? ' AND ' : '';
    //   let orderComma = '';

    //   for (const key in req.query) {
    //     if (req.query[key] && key !== 'searchterm') {
    //       if (!orderClause) {
    //         orderClause = `ORDER BY `;
    //       }

    //       let likeString = req.query[key].replace('%plus%', '+');
    //       whereClause += ` ${andClause}LOWER(${key}) LIKE LOWER('%${likeString}%')`;
    //       orderClause += `${orderComma}${key} ASC`;
    //       andClause = ' AND ';
    //       orderComma = ',';
    //     }
    //   }
    // }

    // let query = `SELECT redshift_name as "table", * from "${schema_name}"."source_metadata" ${whereClause} ${orderClause}`;

    // const params = {
    //   QueryString: query,
    //   WorkGroup: 'primary',
    // };


    let searchTerm = req.query.searchterm;

    let whereClause = `WHERE `;
    let orderClause = '';

    if (searchTerm) {
      whereClause += ` (LOWER(title) LIKE LOWER('%${searchTerm}%')
      OR LOWER(description) LIKE LOWER('%${searchTerm}%')
      OR LOWER(measure_title) LIKE LOWER('%${searchTerm}%')
      OR LOWER(upload_title) LIKE LOWER('%${searchTerm}%')
      OR LOWER(upload_filename) LIKE LOWER('%${searchTerm}%')
      OR LOWER(topic) LIKE LOWER('%${searchTerm}%')
      OR LOWER(subtopic) LIKE LOWER('%${searchTerm}%')
      OR LOWER(characteristics) LIKE LOWER('%${searchTerm}%')
      OR LOWER(characteristics_short_names) LIKE LOWER('%${searchTerm}%')
      OR LOWER(characteristics_options) LIKE LOWER('%${searchTerm}%')
      OR LOWER(classification) LIKE LOWER('%${searchTerm}%')
      OR LOWER(type_of_statistic) LIKE LOWER('%${searchTerm}%')) `;
    }

    if (Object.keys(req.query).length !== 0) {
      let andClause = searchTerm ? ' AND ' : '';
      let orderComma = '';

      for (const key in req.query) {
        if (req.query[key] && key !== 'searchterm') {
          if (!orderClause) {
            orderClause = `ORDER BY `;
          }

          let likeString = req.query[key].replace('%plus%', '+');
          whereClause += ` ${andClause}LOWER(${key}) LIKE LOWER('%${likeString}%')`;
          orderClause += `${orderComma}${key} ASC`;
          andClause = ' AND ';
          orderComma = ',';
        }
      }
    }

    whereClause = whereClause.replace(/(\r\n|\n|\r)/gm, "");
    orderClause = orderClause.replace(/(\r\n|\n|\r)/gm, "");

    // res.json(`SELECT * from Normalized_data ${whereClause} ${orderClause}`);
    const params = {
      database: 'dev',
      resourceArn: process.env.RARN,
      secretArn: process.env.SARN,
      sql: `SELECT * from Normalized_data ${whereClause} ${orderClause}`,
    };

    const client = new RDSDataClient({ region: region });
    const command = new ExecuteStatementCommand(params);
    client.send(command).then(
      (data) => {
        res.json(data);
      },
      (error) => {
        res.json(error);
      }
    );
  } else {
    res.status(400);
    res.json('Query param searchTerm is required');
  }
});

app.listen(3000, function () {
  console.log('Aurora Search API started');
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
