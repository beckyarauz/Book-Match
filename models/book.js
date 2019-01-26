const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const bookSchema = new Schema({
  title: String,
  description: String,
  googleBooksID: String,
  pictureURL: String,
});

const Book = mongoose.model('book',bookSchema);

module.exports = Book;