const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userBookListItemSchema = new Schema({
  userId: mongoose.Schema.Types.ObjectId,   //will contain reference (_id) to stored book in "books" collection
  bookId: mongoose.Schema.Types.ObjectId,   //will contain reference (_id) to stored user in "users" collection
  starred: Boolean                          //true if user has starred/favourited this book
});

const userBookListItem = mongoose.Model('userBookListItem',userBookListItemSchema);
module.exports(userBookListItem);