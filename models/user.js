const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  firstName:String,
  lastName: String,
  picture: String,
  description: String,
  country: String,
  city: String,
  languages:[String],
  categories:[String],
  interests:[String],
  friends:[mongoose.Schema.Types.ObjectId],
  fbID: String,
  igID: String,
  slackID: String,
  twitterID: String,
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