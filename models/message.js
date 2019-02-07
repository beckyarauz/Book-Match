const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    to: String,
    message: String,
    from: String,
    senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
}, {
    timestamps: true
});

const Message = mongoose.model('message', messageSchema);


module.exports = Message;