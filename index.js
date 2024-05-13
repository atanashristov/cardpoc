const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const express = require('express');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1bejWECG8T_GBa7ydVhkEs2lXsTnxKHg-0yKjOXJ82Lk',
    range: 'Class Data!A2:E',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  console.log('Name, Major:');
  rows.forEach((row) => {
    // Print columns A and E, which correspond to indices 0 and 4.
    console.log(`${row[0]}, ${row[4]}`);
  });
}

// authorize().then(listMajors).catch(console.error);


async function getCardsForUser(auth, userId) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1bejWECG8T_GBa7ydVhkEs2lXsTnxKHg-0yKjOXJ82Lk',
    range: 'cardpoc!A2:L',
  });

  const rows = res.data.values;
  console.log(`Got ${rows.length} rows of data`);
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return [];
  }

  console.log(`First row from data:`);
  console.log(rows[0]);

  console.log(`Filter data for userId = ${userId}`);
  const userRows = rows.filter((row) => row[0].toLowerCase() === userId);
  console.log(`Got ${userRows.length} rows of data for userId = ${userId}`);

  console.log(`Prepare result for userId = ${userId}`);
  const result = userRows.map((row) => {
    return {
      userId : row[0],
      cardId : row[1],
      expirationDate : row[2],
      priority : row[3],
      overline : row[4],
      title : row[5],
      subtitle : row[6],
      body1 : row[7],
      body2 : row[8],
      button1 : row[9],
      button2 : row[10],
      badge : row[11]
    }})
    .filter((row) => Date.parse(row.expirationDate) >= Date.now())
    .sort((row1, row2) => {
      if (row1.priority < row2.priority) {
        return -1;
      } else if (row1.priority > row2.priority) {
        return 1;
      } else {
        return 0;
      }
    });
  console.log(`Got ${result.length} rows of data for userId = ${userId}`);
  console.log(result);

  return result;
}

const app = express ();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server Listening on PORT:', PORT);
});

app.get('/cardpoc/:userId', (request, response) => {

  const userId = request.params.userId.toLowerCase();

  authorize().then(auth => getCardsForUser(auth, userId))
    .then(data => response.status(200).send({
        'success': true,
        'message': undefined,
        'data': data}))
    .catch(error => response.status(500).send({
      'success': false,
      'message': error,
      'data': undefined}));
});