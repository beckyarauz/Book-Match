const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const bookListSchema = new Schema({
  userId: mongoose.Schema.Types.ObjectId,   //will contain reference (_id) to stored book in "books" collection
  bookId: String,   //will contain reference (_id) to stored user in "users" collection
  starred: Boolean                          //true if user has starred/favourited this book
});

const BookList = mongoose.model('BookList',bookListSchema);
module.exports = BookList;