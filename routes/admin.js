const express = require('express');
const admin = express.Router();
const ensureLogin = require('connect-ensure-login'); 

admin.get('/',ensureLogin.ensureLoggedIn('/login'),(req, res, next) =>{
    let role = 'ADMIN';
    if (req.user.role === role) {
        res.render('admin', {
            layout:'private-layout',
            user: req.user
          });
    } else {
      res.redirect('/home');
    }
})

module.exports = admin;