const express = require('express');
const admin = express.Router();
const ensureLogin = require('connect-ensure-login');

const User = require('../models/user');
const Book = require('../models/book');
const BookList = require('../models/bookList');
const Message = require('../models/message');

let checkAdmin = function (req, res, next) {
    let role = 'ADMIN';
    if (req.user.role === role) {
        next();
    } else {
        res.redirect('/home');
    }
}

admin.use(ensureLogin.ensureLoggedIn('/login'));
admin.use(checkAdmin);

admin.get('/', (req, res, next) => {
    res.render('admin', {
        layout: 'private-layout',
        admin: req.user
    });
});

admin.get('/manage-users', (req, res, next) => {
    let notfound = 'No users found';
    (async () => {
        try {
            let users = await User.find({'_id': {$ne: req.user._id}});

            if (users !== null) {
                res.render('manage-users', {
                    layout: 'private-layout',
                    admin: req.user,
                    users,
                    isAdmin: true
                });
            } else {
                res.render('manage-users', {
                    layout: 'private-layout',
                    admin: req.user,
                    error: notfound,
                    isAdmin: true
                });
            }
        } catch (e) {
            console.log('GET /manage-users Error:', e.message)
        }

    })();
});

admin.post('/manage-users', (req, res, next) => {
    let notfound = 'No users found';
    console.log(req.body.action);
    let action = req.body.action;
    (async () => {
        try {
            if(action.delete){
                let userId = action.user;
                
                let deletedBooklist = await BookList.deleteMany({'userId': userId});
                let deletedMessages = await Message.deleteMany({'receiverId': userId});
                let deletedUser = await User.findByIdAndDelete({'_id': userId });

                if(deletedBooklist !== null){
                    console.log('You deleted its Book List:', deletedBooklist);
                }
                if(deletedBooklist !== null){
                console.log('You deleted its Messages:', deletedMessages);
                }
                if(deletedUser !== null){
                    console.log('You deleted this user:', deletedUser);
                }
            }
        } catch (e) {
            console.log('GET /manage-users Error:', e.message)
        }

    })();
})



module.exports = admin;