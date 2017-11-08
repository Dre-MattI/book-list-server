'use strict';

const pg = require('pg');
const express = require('express');
// const fs = require('fs');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

const conString = 'postgres://postgres:081583@localhost:5432/postgres';
const client = new pg.Client(conString);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());


app.get('/test', (request, response) => response.send('Hello World!'));

app.get('/api/v1/books', (request, response) => {
  client.query(`
     SELECT book_id, title, author, image_url FROM books;`)
    .then(result => response.send(result.rows))
    .catch(err => console.log(err));
});

app.get('*', (request, response) => response.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

loadDB();

function loadBooks() {
  console.log('************');
  client.query(`SELECT count(*) FROM books`)
    .then(result => {
      if (!parseInt(result.rows[0].count)){
        cors.readFile('data/books.json', function(err, file) {
          JSON.parse(file.toString()).forEach(book => {
            client.query(`
              INSERT INTO
              books(title, author, isbn, image_url, description)
                VALUES($1, $2, $3, $4, $5);`,
              [book.author, book.title, book.isbn, book.image_url, book.description]
            )
          })
        })
      }
    })
    .then(err => console.log('shits broke son'(err)));
}

function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS
    books (
      book_id SERIAL PRIMARY KEY,
      author VARCHAR(50),
      title VARCHAR(50),
      isbn VARCHAR(50),
      image_url TEXT,
      description TEXT
    );`
  )
    .then(data => loadBooks(data))
    .catch(err => console.log(err));
}
