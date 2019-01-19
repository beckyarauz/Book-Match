const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  slackID: String,
  fbID: String,
  lastName: String,
  picture: String,
  description: String,
  fav_books:{
    type: Array,
  },
  read_books:{
    type: Array,
  },
  role: {
    type: String,
    enum : ['GUEST', 'ADMIN'],
    default : 'GUEST'
  },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;