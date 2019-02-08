const express = require('express');
const router = express.Router();

const User = require("../models/user");

const bcrypt = require("bcryptjs");
const bcryptSalt = 10;

const passport = require("passport");

const LocalStrategy = require('passport-local').Strategy;


var zxcvbn = require('zxcvbn');

// var Recaptcha = require('express-recaptcha').Recaptcha;
// //or with options
// var options = {'theme':'dark'};
// var recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY, options);

// const sitekey_recaptcha = process.env.RECAPTCHA_SITE_KEY;

/* GET home page */

router.get('/signup',(req, res, next) => {
  // console.log(req.user);
  if(req.user === undefined){
    res.render('auth/signup');
  } else {
    res.redirect('/home');
  }
});


router.get('/login', (req, res, next) => {
  // console.log(req.user);
  if(req.user === undefined){
    res.render('auth/login', { message: req.flash('error') });
  } else {
    res.redirect('/');
  }
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
  passReqToCallback: true,
}));

router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect('/home');
  });
});

router.post("/signup"/*, recaptcha.middleware.verify*/, (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashPass = bcrypt.hashSync(password, salt);

  if (username === "" || password === "") {
    res.render("auth/signup", {
      message: "Indicate a username and a password to sign up"
    });
    return;
  }

  User.findOne({
      "username": username
    })
    .then(user => {
      if (user !== null) {
        res.render("auth/signup", {
          error: "The username already exists!"
        });
        return;
      }

      const result = zxcvbn(password);

      if (result.score < 3) {
        res.render("auth/signup", {
          suggestion: result.feedback.suggestions,
        });
        return;
      }

      //if (!req.recaptcha.error) {
        const salt = bcrypt.genSaltSync(bcryptSalt);
        const hashPass = bcrypt.hashSync(password, salt);

        const newUser = User({
          username,
          password: hashPass
        });

        newUser.save()
          .then(user => {

            passport.authenticate('local')(req, res, function () {
            res.redirect('/profile-setup');
          })
          }).catch(error => console.log(error))
      // } else {
      //   res.render("auth/signup", {
      //     message: 'Please select captcha',
      //   });
      //   // console.log(req.recaptcha.error);
      //   return;
      // }
      })
    .catch(error => {
      next(error);
    })
});

module.exports = router;
