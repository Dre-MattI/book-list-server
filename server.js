
'use strict';

const pg = require('pg');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


app.get('/test', (request, response) => response.send('Hello World!'));



app.get('/api/v1/books', (request, response) => {
  console.log('this is the get for the books');
  client.query(`
     SELECT book_id, title, author, image_url FROM books
     ORDER BY book_id ASC;
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
      console.log('sending data')
      response.send(result.rows)})
    .catch(err => console.log(err));
});

app.put('/book/update/:id', bodyParser, (request, response) => {
  console.log('this is working');
  let {title, author, isbn, image_url, description} = request.body;
  client.query(`
    UPDATE books
    SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5
    WHERE book_id=$6
    `,
    [title, author, isbn, image_url, description, request.params.id]
  )
    .then(() => response.send('update complete'))
    .catch(err => console.error(err))
})

app.post('/book/new', bodyParser, (request, response) => {
  client.query(`
    INSERT INTO books(title, author, isbn, image_url, description)
    VALUES ($1, $2, $3, $4, $5);`,
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description]),
  function(err) {
    if (err) console.error(err);
    response.send('insert complete');
  }
})

app.delete('/book/delete/:id', (request, response) => {
  console.log('trying to delete');
  client.query(`
    DELETE FROM books
    WHERE book_id=${request.params.id};
    `)
    .then(() => response.send(`deleted book with id ${request.params.id}`))
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
