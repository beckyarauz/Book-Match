const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  slackID: String,
  firstName: String,
  lastName: String,
  picture: String,
  userWords:{
    type: Array,
    default : ["I'm Awesome","I love dogs", "SpongeBob"]
  },
  role: {
    type: String,
    enum : ['GUEST', 'EDITOR', 'ADMIN'],
    default : 'GUEST'
  },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;