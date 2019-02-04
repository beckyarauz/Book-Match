const express = require("express");
const site = express.Router();
const ensureLogin = require('connect-ensure-login');
const request = require('request');
const rp = require('request-promise');
const fetch = require("node-fetch");
const checkGuest = checkRoles('GUEST');
const checkEditor = checkRoles('EDITOR');
const checkAdmin = checkRoles('ADMIN');

const bcrypt = require("bcryptjs");
const bcryptSalt = 10;

const User = require('../models/user');
const Book = require('../models/book');
const BookList = require('../models/bookList');

site.get("/", (req, res, next) => {
  res.render("home");
});
site.get("/home", (req, res, next) => {
  res.render("home");
});

// //without params: render profile page for logged in user
site.get('/profile', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  let username,
    firstname,
    lastname,
    gender,
    userpicture,
    usercountry,
    usercity,
    userfbID,
    userigID,
    userslackID,
    usertwitterID,
    isProfileOwner,
    bookList,
    bookArr = [];
    favBookArr = [];


  const getUser = async () => {
    let user;

    user = await User.findOne({
      username: req.user.username
    });

    username = user.username;
    firstname = user.firstName;
    lastname = user.lastName;
    gender = user.gender;
    userpicture = user.picture;
    usercountry = user.country;
    usercity = user.city;
    userfbID = user.fbID;
    userigID = user.igID;
    userslackID = user.slackID;
    usertwitterID = user.twitterID;
    isProfileOwner = true;

    bookList = await BookList.find({
      userId: user._id,
    });

    for (book of bookList) {
        let url = `https://www.googleapis.com/books/v1/volumes/${book.bookId}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;
        const response = await fetch(url);
        const json = await response.json();

        bookArr.push(json.volumeInfo);

      if (book.starred) {
        favBookArr.push(json.volumeInfo);
      } 
    }
  }

  const getAllInfo = async () => {
    await getUser(req);
    res.render('profile', {
      username,
      gender,
      favbooks: favBookArr,
      books: bookArr,
      firstname,
      lastname,
      userpicture,
      usercountry,
      usercity,
      userfbID,
      userigID,
      userslackID,
      usertwitterID,
      isProfileOwner,
    });
  }

  getAllInfo();

});

// //with params: render profile page for the user listed in the request
site.get('/profile/:username', ensureLogin.ensureLoggedIn('/login'), (req, res) => {

  User.findOne({
      username: req.params.username
    })
    .then(user => {
      let isOwner = req.params.username == req.user.username;
      res.render('profile', {
        username: user.username,
        firstname: user.firstName,
        lastname: user.lastName,
        userpicture: user.picture,
        usercountry: user.country,
        usercity: user.city,
        userfbID: user.fbID,
        userigID: user.igID,
        userslackID: user.slackID,
        usertwitterID: user.twitterID,
        isProfileOwner: isOwner
      });
    })
    .catch(err => console.log(err));

});

site.get('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  User.findOne({
      username: req.user.username
    })
    .then(user => {
      res.render('profileSetup', {
        username: user.username,
        firstname: user.firstName,
        lastname: user.lastName,
        userpicture: user.picture,
        description: user.description,
        usercountry: user.country,
        usercity: user.city,
        userfbID: user.fbID,
        userigID: user.igID,
        userslackID: user.slackID,
        usertwitterID: user.twitterID
      });
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
    twitterID: req.body.usertwitterID,
    password: req.body.newpass,
    gender: req.body.gender
  };
  //console.log(`form data: ${updatedUser.firstname} ${updatedUser.lastname} ${updatedUser.description}`);
  User.findOne({
      username: updatedUser.username
    })
    .then(user => {
      console.log(`form data: ${updatedUser.firstname} ${updatedUser.lastname} ${updatedUser.description}`);
      if (updatedUser.password === "") {
        updatedUser.password = user.password;
      } else {
        let salt = bcrypt.genSaltSync(bcryptSalt);
        updatedUser.password = bcrypt.hashSync(updatedUser.password, salt);
      }

      let genderResult = {'N':false,'F':false,'M':false};

      switch(updatedUser.gender){
        case 'F': 
          genderResult['F'] = true;
          break;
        case 'M': 
          genderResult['M'] = true;
          break;
        case 'N': 
          genderResult['N'] = true;
          break;
      }

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
        twitterID: updatedUser.twitterID,
        password: updatedUser.password,
        gender:genderResult
      });
      user.save().then(user => {
          //console.log(user);
          res.redirect('/profile-setup');
        })
        .catch(err => {
          console.log(err)
        });
    })
    .catch(err => console.log(err));

});


site.get('/admin', checkAdmin, (req, res) => {
  res.render('admin', {
    user: req.user
  });
});

site.get('/search', (req, res, next) => {
  if (req.query.book != undefined) {
    const list = req.query.book.split(' ').join('+');
    const url = `https://www.googleapis.com/books/v1/volumes?q=${list}&key=${process.env.GOOGLE_BOOKS_API_KEY}&langRestrict=en&orderBy=relevance`;
    let items;

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let info = JSON.parse(body);
        items = info.items.map(item => item);
        bookIds = items.map( item => {
          return  item.id
        });

        BookList.find({
          'userId': req.user._id,
          'bookId': {$in: bookIds}
        })
        .then(books => {
          let starredBooks = books.filter(book =>book.starred);
          // console.log('starredBooks:',starredBooks);

          let bookInfo = items.map( item => {
            return {
              'id': item.id,
              'image': item.volumeInfo.imageLinks.thumbnail,
              'title': item.volumeInfo.title,
              'subtitle': item.volumeInfo.subtitle,
              'starred': (() => {
                // for(book of starredBooks){
                  for(let i = 0; i < starredBooks.length;i++){
                  // console.log(`comparing ${item.id} and ${book.bookId}`);
                  if(item.id === starredBooks[i].bookId){
                    return true;
                  } 
                }
              })()
            }
          });

          // console.log('info!:',bookInfo);
        
          res.render('search', {
            bookInfo
          });
        })
        .catch(e => console.log(e.message));
        
      }
    })} else {
    res.render('search');
  }
});

site.post('/search', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  const action = req.body.action;

  if(action.star || action.add){
    BookList.findOne({
      'userId': req.user._id,
      'bookId': action.book
    })
    .then(data => {
      if (data === null){
        console.log('There is no book on BookList collection');
            User.findOne({
                username: req.user.username
              })
              .then(user => {
                if(action.star){
                  console.log('you added book to favorites and your collection');
                  user.set({
                    starredBookLimit: --req.user.starredBookLimit
                  });
                  user.save();
                  createBookList(user._id, action.book, true);
                } else if(action.add){
                  console.log('you added book to your collection');
                  createBookList(user._id, action.book, false);
                }
              })
              .catch(e => console.log(e));
      } else  {
        if(action.add){
          console.log('Book has already been added');
          return;
        } else if(action.star){
          BookList.findOne({'userId': req.user._id,'bookId': action.book})
          .then(book =>{
            if(book.starred){
              console.log('this book will be removed from your favorites');
              book.set({starred:false});
              book.save()
              .then(book => {
                console.log(book);
              }).catch(e=> {console.log(e.message)});
              User.findOneAndUpdate({'_id': req.user._id},{starredBookLimit:++req.user.starredBookLimit});
            } else{
              console.log('this book will be added to your favorites');
              book.set({starred:true});
              book.save();
              User.findOneAndUpdate({'_id': req.user._id},{starredBookLimit:--req.user.starredBookLimit});
            }
          })
        }
      }
    })
    .catch(e => console.log(e.message))
  } else if(action.remove){
    
    BookList.findOneAndDelete({
      'userId': req.user._id,
      'bookId': action.book
    }).then(book => {
      console.log('Book has been removed from collection:',book);
    })
    .catch(e => console.log(e.message));
  }

});


site.get('/book/:bookID' /*,ensureLogin.ensureLoggedIn('/login')*/ , (req, res, next) => {
  //const url = `https://www.googleapis.com/books/v1/volumes?q=${list}&key=${process.env.GOOGLE_BOOKS_API_KEY}&langRestrict=en&orderBy=relevance`;
  console.log(req.params.bookID);
  const url = `https://www.googleapis.com/books/v1/volumes/${req.params.bookID}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;
  let items;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let info = JSON.parse(body);
      //console.log(info)
      //items = info.items.map(item => item);
      //console.log(items);
      //res.send(info);
      res.render('./public/book-detail', {
        book: info
      })
      return;
    } else {
      res.send("Error!");
    }
  })
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

async function createBookList(userId, bookId,starred) {
  bookList = new BookList({
    userId: userId,
    bookId: bookId,
    starred:starred
  })

  mybook = await bookList.save();
  console.log('The book was saved!', mybook);
  return mybook;
}

site.get('/matches',ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  //console.log("matches!");
  //Query DB for list of own read books
  BookList.find({userId:req.user._id})
  .then((bookList) => {
    //console.log(bookList);
    bookArr = bookList.map((el) => el.bookId)
    //res.send(bookList); 
    //res.send(bookArr);
    console.log("Own book list: " +bookArr);
    //Query DB for list of users with a count their respective number of matching books
    BookList.aggregate([
      {
         $match: { //match books with own book list
          bookId: {$in: bookArr}
          //,userId: {$ne: req.user._id} //exclude own user --> disable for testing
        }
      },
      {
        $group: { //aggregate matching books on each user
          _id: '$userId',
          matchingBooks: {$sum:1}
        }
      },
      {
        $lookup: { //lookup user details from "users" collection
          from:'users',
          localField:'_id',
          foreignField:'_id',
          as:'user'
        }
      },
      {$unwind:"$user"}
    ]).sort({matchingBooks:-1}) //sort by number of matching books, descending
    .then((matches) => {
      //res.send(matches)
      res.render('matches-test',{matches:matches});
    })
    .catch(err => {
      console.log(err);
      res.send(err);
    })
  })
  .catch(err => {
    console.log(err);
    res.send(err);
  });
});

module.exports = site;