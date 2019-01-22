const express    = require("express");
const site = express.Router();
const ensureLogin = require('connect-ensure-login');

const checkGuest  = checkRoles('GUEST');
const checkEditor = checkRoles('EDITOR');
const checkAdmin  = checkRoles('ADMIN');

const User = require('../models/user');

site.get("/", (req, res, next) => {
  res.render("home");
});
site.get("/home", (req, res, next) => {
  res.render("home");
});


site.get('/private',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('private',{username: user.username,firstname: user.firstName,lastname: user.lastName,userpicture:user.picture});
  })
  .catch(err => console.log(err));
    
});



site.post('/profile', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  const firstname = req.body.firstName;
  const lastname = req.body.lastName;
  const userpicture = req.body.profilePic;
  const description = req.body.description;
  
  User.findOne({username:req.user.username})
  .then(user => {
    user.set({
      firstName: firstname,
      lastName: lastname,
      picture: userpicture,
      description: description,
    })
    user.save();
    console.log(user);

    res.render('profile',{username: user.username,firstname,lastname,userpicture});
  })
  .catch(err => console.log(err));
  
});

site.get('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
    res.render('profileSetup',{username: req.user.username});
});

site.get('/admin', checkAdmin, (req, res) => {
  res.render('admin', {user: req.user});
});





function checkRoles(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/home')
    }
  }
}



module.exports = site;