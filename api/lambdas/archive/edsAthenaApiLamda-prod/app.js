/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["ACCESS_KEY_ID","SECRET_ACCESS_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

// import {
//   AthenaClient,
//   StartQueryExecutionCommand,
//   GetQueryExecutionCommand,
//   GetQueryResultsCommand,
// } from '@aws-sdk/client-athena';

const {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
} = require('@aws-sdk/client-athena');

const { of } = require('rxjs');
// import { of } from 'rxjs';
const {
  concatMap,
  delay,
  map,
  mergeMap,
  retryWhen,
  tap,
} = require('rxjs/operators');

const aws = require('aws-sdk');
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

async function getSecret() {
  const { Parameters } = await new aws.SSM()
    .getParameters({
      Names: ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY'].map(
        (secretName) => process.env[secretName]
      ),
      WithDecryption: true,
    })
    .promise();

  return Parameters;
}

let client;

async function clientSend(command) {
  let res;
  try {
    res = await client.send(command);
    return res;
    // process data.
  } catch (error) {
    // error handling.
    const { requestId, cfId, extendedRequestId } = error.$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    return false;
  } finally {
    // finally.
  }
}

async function getQueryStatus(command) {
  return of({}).pipe(
    mergeMap((_) => clientSend(command)),
    map((res) => {
      if (
        res.QueryExecution.Status.State === 'QUEUED' ||
        res.QueryExecution.Status.State === 'RUNNING'
      ) {
        throw res.QueryExecution.Status.State;
      }

      return res;
    }),
    retryWhen((errors) =>
      errors.pipe(
        tap((res) => console.log(`Status ${res}`)),
        delay(300)
      )
    )
  );
}

const schema_name = `eds_lake_${process.env.ENV}`;

app.get('/lookup-source-metadata', async function (req, res) {
  if (req.query.searchterm || req.query) {
    const secretParams = await getSecret();

    client = new AthenaClient({
      region: 'eu-west-2',
      credentials: {
        accessKeyId: `${secretParams[0].Value}`,
        secretAccessKey: `${secretParams[1].Value}`,
      },
    });

    let searchTerm = req.query.searchterm;

    let whereClause = `WHERE `;
    let orderClause = '';

    if (searchTerm) {
      whereClause += ` (LOWER(title) LIKE LOWER('%${searchTerm}%')
      OR LOWER(description) LIKE LOWER('%${searchTerm}%')
      OR LOWER(topic) LIKE LOWER('%${searchTerm}%')
      OR LOWER(subtopic) LIKE LOWER('%${searchTerm}%')
      OR LOWER(dimension) LIKE LOWER('%${searchTerm}%')
      OR LOWER(classification) LIKE LOWER('%${searchTerm}%')
      OR LOWER(type_of_statistic) LIKE LOWER('%${searchTerm}%')
      OR LOWER(publisher) LIKE LOWER('%${searchTerm}%')
      OR LOWER(publisher_abbreviations) LIKE LOWER('%${searchTerm}%')) `;
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

    let query = `SELECT redshift_name as "table", * from "${schema_name}"."source_metadata" ${whereClause} ${orderClause}`;

    const params = {
      QueryString: query,
      WorkGroup: 'primary',
    };

    const command = new StartQueryExecutionCommand(params);

    try {
      const data = await clientSend(command);

      const statusCommand = new GetQueryExecutionCommand({
        QueryExecutionId: `${data.QueryExecutionId}`,
      });

      const result = new GetQueryResultsCommand({
        QueryExecutionId: `${data.QueryExecutionId}`,
      });

      of({})
        .pipe(
          concatMap(async (success) =>
            (await getQueryStatus(statusCommand)).toPromise()
          ),
          concatMap((success) =>
            clientSend(result)
              .then((response) => {
                res.json(response.ResultSet);
              })
              .catch((error) => {
                console.log(error.response);
              })
          )
        )
        .toPromise();
    } catch (error) {
      // error handling.
    } finally {
      // finally.
    }
  } else {
    res.status(400);
    res.json('Query param searchTerm is required');
  }
});

app.listen(3000, function () {
  console.log('Athena API started');
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
