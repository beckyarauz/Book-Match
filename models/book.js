const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const bookSchema = new Schema({
  title: String,
  description: String,
  googleBooksID: String,
  pictureURL: String
});

const book = mongoose.Model('book',bookSchema);
module.exports(book);