const express    = require("express");
const site = express.Router();
const ensureLogin = require('connect-ensure-login');
const request = require('request');
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

//without params: render profile page for logged in user
site.get('/profile',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('profile',{username: user.username,firstname: user.firstName,lastname: user.lastName,userpicture:user.picture,isProfileOwner:true});
  })
  .catch(err => console.log(err));
    
});

//with params: render profile page for the user listed in the request
site.get('/profile/:username',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  
  User.findOne({username:req.params.username})
  .then(user => {
    let isOwner = req.params.username==req.user.username;
    res.render('profile',{username: user.username,firstname: user.firstName,lastname: user.lastName,userpicture:user.picture,isProfileOwner:isOwner});
  })
  .catch(err => console.log(err));
    
});

site.post('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  const firstname = req.body.firstName;
  const lastname = req.body.lastName;
  const userpicture = req.body.profilePic;
  const description = req.body.description;
  console.log("form data: "+firstname+" "+lastname+" "+description);
  User.findOne({username:req.user.username})
  .then(user => {
    user.set({
      firstName: firstname,
      lastName: lastname,
      picture: userpicture,
      description: description,
    })
    user.save();
    console.log('user saved');
    console.log(user);

    res.redirect('/profile');
  })
  .catch(err => console.log(err));
  
});

site.get('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('profileSetup',{username: user.username,firstname: user.firstName,lastname: user.lastName,userpicture:user.picture,description:user.description});
  })
  .catch(err => console.log(err));
});

site.get('/admin', checkAdmin, (req, res) => {
  res.render('admin', {user: req.user});
});


// site.get('/search', (req, res) => {
//   res.render('public/search');
// })
// site.get('/book', (req, res) => {
//   console.log(res);
//   // const url = https://www.googleapis.com/books/v1/volumes?q=potter+inauthor:keyes&key=AIzaSyBhlg3RrbFdAHDlOn4baYiKmRNqpRztwSc

//   res.render('public/book');
// })
site.get('/search', (req, res, next) => {
  if( req.query.book != undefined){
    const list = req.query.book.split(' ').join('+');
    const url = `https://www.googleapis.com/books/v1/volumes?q=${list}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
    let items;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        
        let info = JSON.parse(body);
        items = info.items.map(item => item.volumeInfo);
        // console.log(items);

        const maxLength = 100; // maximum number of characters to extract

        //trim the string to the maximum length
        // var trimmedString = items.map(item => item.description.substr(0, maxLength));
        var trimmedString = items
        .map(item => {
          if(item.description !== undefined && item.description !== null && item.description.length > 0)
          item.description.substr(0, maxLength)
        });
        
        // trimmedString = trimmedString.map(str => str.substr(0, Math.min(str.length, str.lastIndexOf(" "))))
        // console.log(trimmedString);
        // trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
        // console.log(trimmedString);
        res.render('public/search',{items});
        return;
      }
  })
  }
  
  

  res.render('public/search');
  
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