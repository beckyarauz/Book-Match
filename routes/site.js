const express = require("express");
const site = express.Router();
const ensureLogin = require('connect-ensure-login');
const request = require('request');
const checkGuest = checkRoles('GUEST');
const checkEditor = checkRoles('EDITOR');
const checkAdmin = checkRoles('ADMIN');

const User = require('../models/user');

site.get("/", (req, res, next) => {
  res.render("home");
});
site.get("/home", (req, res, next) => {
  res.render("home");
});

// //without params: render profile page for logged in user
site.get('/profile',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('profile',{
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      userpicture:user.picture,
      usercountry: user.country,
      usercity: user.city,
      userfbID: user.fbID,
      userigID: user.igID,
      userslackID: user.slackID,
      usertwitterID: user.twitterID,
      isProfileOwner:true});
  })
  .catch(err => console.log(err));
    
});

// //with params: render profile page for the user listed in the request
site.get('/profile/:username',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  
  User.findOne({username:req.params.username})
  .then(user => {
    let isOwner = req.params.username==req.user.username;
    res.render('profile',{
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      userpicture:user.picture,
      usercountry: user.country,
      usercity: user.city,
      userfbID: user.fbID,
      userigID: user.igID,
      userslackID: user.slackID,
      usertwitterID: user.twitterID,
      isProfileOwner:isOwner});
  })
  .catch(err => console.log(err));
    
});

site.get('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('profileSetup',{
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      userpicture:user.picture,
      description:user.description,
      usercountry: user.country,
      usercity: user.city,
      userfbID: user.fbID,
      userigID: user.igID,
      userslackID: user.slackID,
      usertwitterID: user.twitterID});
  })
  .catch(err => console.log(err));
});

site.post('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  let updatedUser = {
    username: req.user.username,
    firstname: req.body.firstName,
    lastname: req.body.lastName,
    userpicture: req.body.profilePic,
    description: req.body.description,
    country: req.body.usercountry,
    city: req.body.usercity,
    fbID: req.body.userfbID,
    igID: req.body.userigID,
    slackID: req.body.userslackID,
    twitterID: req.body.usertwitterID
  };
  console.log(`form data: ${updatedUser.firstname} ${updatedUser.lastname} ${updatedUser.description}`);
  User.findOne({username:updatedUser.username})
  .then(user => {
    user.set({
      firstName: updatedUser.firstname,
      lastName: updatedUser.lastname,
      picture: updatedUser.userpicture,
      description: updatedUser.description,
      country: updatedUser.country,
      city: updatedUser.city,
      fbID: updatedUser.fbID,
      igID: updatedUser.igID,
      slackID: updatedUser.slackID,
      twitterID: updatedUser.twitterID
    })})
    .catch(err => console.log(err));

});


site.get('/admin', checkAdmin, (req, res) => {
  res.render('admin', { user: req.user });
});

site.get('/search', (req, res, next) => {
  if (req.query.book != undefined) {
    const list = req.query.book.split(' ').join('+');
    const url = `https://www.googleapis.com/books/v1/volumes?q=${list}&key=${process.env.GOOGLE_BOOKS_API_KEY}&langRestrict=en&orderBy=relevance`;
    let items;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let info = JSON.parse(body);
        items = info.items.map(item => item.volumeInfo);
        res.render('search', { items });
        return;
      }
    })
  } else {
    res.render('search');
  }

});

site.post('/search', (req, res, next)=>{
  console.log('body',req.body.starred);
  res.send();
})


function checkRoles(role) {
  return function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/home')
    }
  }
}



module.exports = site;