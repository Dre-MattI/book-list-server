'use strict';

const pg = require('pg');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

// const conString = 'postgres://postgres:1234@localhost:5432/postgres';
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


app.get('/test', (request, response) => response.send('Hello World!'));



app.get('/api/v1/books', (request, response) => {
  client.query(`
     SELECT book_id, title, author, image_url FROM books;
     `)
    .then(result => response.send(result.rows))
    .catch(err => console.log(err));
});

app.get('/book/:id', (request, response) => {
  client.query(`
    SELECT * FROM books
    WHERE book_id=$1;`,
    [request.params.id]
  )
    .then(result => {
      console.log(result);
      response.send(result.rows)})
    .catch(err => console.log(err));
});

app.post('/newbook', (request, response) => {
  client.query(`
    INSERT INTO books(title, author, isbn, image_url, description)
    VALUES ($1, $2, $3, $4, $5);`,
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description]),
  function(err) {
    if (err) console.error(err);
    response.send('insert complete');
  }
})

app.get('*', (request, response) => response.redirect(CLIENT_URL));

loadDB();

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

function loadBooks() {
  client.query(`SELECT count(*) FROM books`)
    .then(result => {
      if (!parseInt(result.rows[0].count)){
        fs.readFile('data/books.json', function(err, file) {
          JSON.parse(file.toString()).forEach(book => {
            client.query(`
              INSERT INTO
              books(title, author, isbn, image_url, description)
                VALUES($1, $2, $3, $4, $5);`,
              [book.title, book.author, book.isbn, book.image_url, book.description]
            )
          })
        })
      }
    })
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