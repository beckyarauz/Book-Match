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


function checkRoles(role) {
  return function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/home')
    }
  }
}

// getUser function gets all the information needed to be rendered on user profiles
const getUser = async (req,username) => {
  let user;

  user = await User.findOne({
    username: username
  });
  booklist = await BookList.find({
    userId: user._id,
  }); 

  let userInfo = {
    username : user.username,
    firstname : user.firstName,
    lastname : user.lastName,
    gender : user.gender,
    userpicture : user.picture,
    usercountry : user.country,
    usercity : user.city,
    userfbID : user.fbID,
    userigID : user.igID,
    userslackID : user.slackID,
    usertwitterID : user.twitterID,
    isProfileOwner : req.params.username == req.user.username,
    bookList: booklist,
    bookArr : [],
    favBookArr : [],
  }
  for (book of userInfo.bookList) {
    let url = `https://www.googleapis.com/books/v1/volumes/${book.bookId}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    userInfo.bookArr.push(json.volumeInfo);

    if (book.starred) {
      userInfo.favBookArr.push(json.volumeInfo);
    }
  }
  return userInfo;
}

const createBookList = async (userId, bookId, starred) => {
  bookList = new BookList({
    userId: userId,
    bookId: bookId,
    starred: starred
  })

  mybook = await bookList.save();
  console.log('The book was saved!', mybook);
  return mybook;
}

site.get("/", (req, res, next) => {
  res.render("home");
});
site.get("/home", (req, res, next) => {
  res.render("home");
});

// //without params: render profile page for logged in user
site.get('/profile', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  let isOwner = true;
  let username = req.user.username;
  (async () =>{
    let user = await getUser(req,username);
  
    res.render('profile', {
      username:user.username,
      gender:user.gender,
      favbooks: user.favBookArr,
      books: user.bookArr,
      firstname:user.firstname,
      lastname:user.lastname,
      userpicture:user.userpicture,
      usercountry:user.usercountry,
      usercity:user.usercity,
      userfbID:user.userfbID,
      userigID:user.userigID,
      userslackID:user.userslackID,
      usertwitterID:user.usertwitterID,
      isProfileOwner:isOwner,
    });
  })();

});

// //with params: render profile page for the user listed in the request
site.get('/profile/:username', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  let isOwner = req.user.username === req.param.username;
  let username = req.params.username;
  (async () =>{
    let user = await getUser(req,username);
  
    res.render('profile', {
      username:user.username,
      gender:user.gender,
      favbooks: user.favBookArr,
      books: user.bookArr,
      firstname:user.firstname,
      lastname:user.lastname,
      userpicture:user.userpicture,
      usercountry:user.usercountry,
      usercity:user.usercity,
      userfbID:user.userfbID,
      userigID:user.userigID,
      userslackID:user.userslackID,
      usertwitterID:user.usertwitterID,
      isProfileOwner:isOwner,
    });
  })();

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
      // console.log(`form data: ${updatedUser.firstname} ${updatedUser.lastname} ${updatedUser.description}`);
      if (updatedUser.password === "") {
        updatedUser.password = user.password;
      } else {
        let salt = bcrypt.genSaltSync(bcryptSalt);
        updatedUser.password = bcrypt.hashSync(updatedUser.password, salt);
      }

      let genderResult = {
        'N': false,
        'F': false,
        'M': false
      };

      switch (updatedUser.gender) {
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
        gender: genderResult
      });
      user.save().then(user => {
          //console.log(user);
          res.redirect('/profile');
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
        bookIds = items.map(item => {
          return item.id
        });
        let bookInfo;

        if(req.user){
          BookList.find({
            'userId': req.user._id,
            'bookId': {
              $in: bookIds
            }
          })
          .then(books => {
            let starredBooks = books.filter(book => book.starred);
            let booksDB = books;
            // console.log('ITEMS:',items);

            bookInfo = items.map(item => {
              return {
                'id': item.id,
                'image': item.volumeInfo.imageLinks ?  item.volumeInfo.imageLinks.thumbnail : 'images/book_404.png',
                'title': item.volumeInfo.title,
                'subtitle': item.volumeInfo.subtitle,
                'added':(() => {
                  // for(book of starredBooks){
                  for (let i = 0; i < booksDB.length; i++) {
                    // console.log(`comparing ${item.id} and ${book.bookId}`);
                    if (item.id === booksDB[i].bookId) {
                      return true;
                    }
                  }
                })(),
                'starred': (() => {
                  // for(book of starredBooks){
                  for (let i = 0; i < starredBooks.length; i++) {
                    // console.log(`comparing ${item.id} and ${book.bookId}`);
                    if (item.id === starredBooks[i].bookId) {
                      return true;
                    }
                  }
                })()
              }
            });

            res.render('search', {
              bookInfo
            });
          })
          .catch(e => console.log(e.message));
        } else{
          bookInfo = items.map(item => {
            // console.log(item.volumeInfo.imageLinks);
            return {
              'id': item.id,
              'image': item.volumeInfo.imageLinks ?  item.volumeInfo.imageLinks.thumbnail : 'images/book_404.png',
              'title': item.volumeInfo.title,
              'subtitle': item.volumeInfo.subtitle,
            }
          });
          res.render('search', {
            bookInfo
          });
        }
      }
    })
  } else {
    res.render('search');
  }
});

site.post('/search', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  const action = req.body.action;

  if (action.star || action.add) {
    BookList.findOne({
        'userId': req.user._id,
        'bookId': action.book
      })
      .then(data => {
        if (data === null) {
          console.log('There is no book on BookList collection');
          if(req.user.starredBookLimit === 0){
            console.log(`You can't add more books, you reached your limits.`, `Your book limit: ${req.user.starredBookLimit}`);
          }
          User.findOne({
              username: req.user.username
            })
            .then(user => {
              if (action.star && req.user.starredBookLimit > 0) {
                console.log('you added book to favorites and your collection');
                user.set({
                  starredBookLimit: --req.user.starredBookLimit
                });
                user.save();
                createBookList(user._id, action.book, true);
                User.findOneAndUpdate({
                    '_id': req.user._id
                  }, {
                    starredBookLimit: ++req.user.starredBookLimit
                  })
                  .then(user => {
                    // console.log('updated User:', user);
                  })
                  .catch(e => console.log(e.message));
              } else if (action.add) {
                console.log('you added book to your collection');
                createBookList(user._id, action.book, false);
              }
            })
            .catch(e => console.log(e));
        } else {
          if (action.add) {
            console.log('Book has already been added');
            return;
          } else if (action.star) {
            BookList.findOne({
                'userId': req.user._id,
                'bookId': action.book
              })
              .then(book => {
                if (book.starred) {
                  console.log('this book will be removed from your favorites');
                  book.set({
                    starred: false
                  });
                  book.save()
                    .then(book => {
                      console.log('savedBook:',book);
                    }).catch(e => {
                      console.log(e.message)
                    });
                  User.findOneAndUpdate({
                      '_id': req.user._id
                    }, {
                      starredBookLimit: ++req.user.starredBookLimit
                    })
                    .then(user => {
                      // console.log('updated User:', user);
                    });
                } else if (req.user.starredBookLimit > 0) {
                  console.log('this book will be added to your favorites');
                  book.set({
                    starred: true
                  });
                  book.save();
                  User.findOneAndUpdate({
                      '_id': req.user._id
                    }, {
                      starredBookLimit: --req.user.starredBookLimit
                    })
                    .then(user => {
                      // console.log('updated User:', user);
                    });
                } else {
                  console.log(`You can't add more books, you reached your limits.`, `Your book limit: ${req.user.starredBookLimit}`);
                }
              })
          }
        }
      })
      .catch(e => console.log(e.message))
  } else if (action.remove) {
    BookList.findOneAndDelete({
        'userId': req.user._id,
        'bookId': action.book
      }).then(book => {
        if(book.starred){
          User.findOneAndUpdate({'_id':req.user._id},{'starredBookLimit':++req.user.starredBookLimit})
          .then( user => {
            console.log('removed book and Updated User bookLimit');
          })
          .catch(e => console.log(e.message));
        }
        console.log('Book has been removed from collection:', book);
      })
      .catch(e => console.log(e.message));
  }

});

site.get('/book/:bookID' /*,ensureLogin.ensureLoggedIn('/login')*/ , (req, res, next) => {
  //const url = `https://www.googleapis.com/books/v1/volumes?q=${list}&key=${process.env.GOOGLE_BOOKS_API_KEY}&langRestrict=en&orderBy=relevance`;
  // console.log(req.params.bookID);
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

site.get('/matches', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  //console.log("matches!");
  //Query DB for list of own read books
  let userSearch = req.query.username;
  console.log("Search for user: "+ userSearch);

  (async () =>{
      let bookList = await BookList.find({
          userId: req.user._id
        });
      
      let userInfo = await User.findOne({'_id': req.user._id});
      let myFriends = userInfo.friends;
      console.log('my Friends:',myFriends);
    
      bookArr = bookList.map((el) => el.bookId)
      //Query DB for list of users with a count their respective number of matching books
      
      let matches =  await BookList.aggregate([{
          $match: {
            userId: {$ne: req.user._id} //exclude own user --> disable for testing
          }
        },
        {
          $group: { //calculate number matching books for each user
            _id: '$userId',
            matchingBooks: {
              $sum: {
                $cond: [{
                  $in: ["$bookId", bookArr]
                }, 1, 0]
              }
            },
          }
        },
        {
          $lookup: { //lookup user details from "users" collection
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: { //only display users that have books from requesting users own book list in their collection
            matchingBooks: {$gt: 0}
          }
        },
        {
          $unwind: "$user"
        },
      ]).sort({
        matchingBooks: -1
      });


      for(match of matches){
        let ad = await User.find({
          '_id':req.user._id,
          'friends': match._id
        });
        console.log('ad:',ad);
        
        if(ad !== null && ad.length > 0){
          match.user.added = true;
        } 
      }

      let filteredMatches =[];
      
      matches.forEach((el) => {
          // console.log (el)
          if (userSearch) {
            if (el.user.username.includes(userSearch)) filteredMatches.push(el);
          }
          else {
            if (el.matchingBooks > 0) filteredMatches.push(el)
          }
      });

        console.log('filtered matches',filteredMatches);
      res.render('matches', {
              matches: filteredMatches
            });

      })()

});

site.post('/matches', ensureLogin.ensureLoggedIn('/login'), (req, res, next) =>{
  const action = req.body.action;
  console.log('matches action',action);
  (async () =>{
    if(action.add){
      let user = await User.findOne({
        '_id': req.user._id,
        // 'friends': req.user._id //Test id 
        'friends': action.user
      });

      if(!user || user === null || user === undefined){
        console.log('Friend not found!');
        user = await User.findOne({
          '_id': req.user._id,
        });

        user.friends.push(action.user);

        let updatedFriends = await user.set({
          friends: user.friends
        });
        console.log('You added a Friend! friends:',updatedFriends.friends);

        updatedFriends.save();
      } else {
        console.log('This user is already added to your Friends');
      }

    } else if(action.remove){
      user = await User.findOne({
        '_id': req.user._id,
      });

      let removed = user.friends.splice(action.user,'');

      let updatedFriends = await user.set({
        friends: removed
      });

      console.log('You removed a Friend! friends:',updatedFriends.friends);

      updatedFriends.save();
    }
  
    // res.render('matches');


  })()
  
})

module.exports = site;