const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  gender:{
    type: Object,
    default : {'N': true, 'F': false, 'M': false}
  },
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
  bookGenre:Array,
  fbID: String,
  igID: String,
  slackID: String,
  twitterID: String,
  starredBookLimit: {
    type: Number,
    default : 5
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