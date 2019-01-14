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


// site.get('/private',/*ensureLogin.ensureLoggedIn('/login'),*/ (req, res) => {
//   //dummi info
//   const username = 'jamie009';
//   const firstname = 'James';
//   const lastname = 'Bond';
//   const description = "I'm awesome";
//   const fav_books = [
//     {
//     title: 'Fantastic Beasts and Where to Find Them',
//     img: 'https://images-na.ssl-images-amazon.com/images/I/61U0wM7aHDL.jpg',
//   },  
//     {
//     title: 'Crimes of Grindelwald',
//     img: 'https://ewedit.files.wordpress.com/2018/05/crimes-of-grindelwald.jpg',
//   },  
// ];
//   const userpicture = "https://www.star2.com/wp-content/uploads/2018/05/str2_apjamesbond_tbkho-150x150.jpg";

//   res.render('profile',{username,firstname,lastname,userpicture,description,fav_books});

// //dummi end
// });
site.get('/private',ensureLogin.ensureLoggedIn('/login'), (req, res) => {
//   //dummi info
//   const username = 'jamie009';
//   const firstname = 'James';
//   const lastname = 'Bond';
//   const userpicture = "https://www.star2.com/wp-content/uploads/2018/05/str2_apjamesbond_tbkho-150x150.jpg";

//   res.render('private',{username,firstname,lastname,userpicture});

// //dummi end
  
  User.findOne({username:req.user.username})
  .then(user => {
    res.render('private',{username: user.username,firstname: user.firstName,lastname: user.lastName,userpicture:user.picture});
  })
  .catch(err => console.log(err));
    
});



site.post('/private', ensureLogin.ensureLoggedIn('/login'), (req, res) => {


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
// site.get('/profile-setup',  (req, res) => {
//     res.render('profileSetup',{user: 'beckyarauz'});
// });




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