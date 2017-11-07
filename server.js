'use strict';
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
//const conString = `postgres://USER:4166@${PORT}`;
const client = new pg.Client(process.env.DATABASE_URL);
app.use(cors());


app.get('/test', (request, response) => response.send('Hello World'));

app.get('/tasks', (req, res) => {
  client.query(`SELECT * from tasks;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
