require('dotenv').config();

var fs = require('fs');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bcryptSalt = 10;
const passport = require('passport');
// First example
const LocalStrategy = require('passport-local').Strategy;
// set up Facebook strategy



const flash = require('connect-flash');
const app_name = require('./package.json').name;

const User = require('./models/user');


// Mongoose configuration
mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });

const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();




// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// app.js
app.use(session({
  secret: 'our-passport-local-strategy-app',
  resave: true,
  saveUninitialized: true,
}));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.use(flash());

// // The local strategy is triggered when the user tries to login
passport.use(new LocalStrategy((username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: 'Incorrect username' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: 'Incorrect password' });
    }

    return next(null, user);
  });
}));

// Facebook Strategy


// app.js
app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true,
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

//partials reader
const partialsDir = path.join(__dirname, 'views', 'partials');

const filenames = fs.readdirSync(partialsDir);
filenames.forEach(function (filename) {
  const matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  const name = matches[1];
  const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  hbs.registerPartial(name, template);
});
// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

//create Boss user

User.findOne({ username: 'admin' })
.then(user => {
  if(user){
   return console.log('there is an admin');
  }

  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashPass = bcrypt.hashSync(process.env.BOSS_PASSWORD, salt);

  const newBoss = new User({
    username: process.env.BOSS_USERNAME,
    password: hashPass,
    role: 'ADMIN',
  });
  
  
  newBoss.save()
    .then((user) => {
      console.log('Admin created');
    }).catch(error => console.log(error.message));
})
.catch(err => console.log(err));

const auth = require('./routes/auth');
app.use('/', auth);
const site = require('./routes/site');
app.use('/', site);





module.exports = app;
