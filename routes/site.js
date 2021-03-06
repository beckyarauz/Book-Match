const express = require("express");
const site = express.Router();
const ensureLogin = require('connect-ensure-login');
const request = require('request');
const rp = require('request-promise');
const fetch = require("node-fetch");

const cache = require('memory-cache');

const bcrypt = require("bcryptjs");
const bcryptSalt = 10;

const User = require('../models/user');
const Book = require('../models/book');
const BookList = require('../models/bookList');
const Message = require('../models/message');


let memCache = new cache.Cache();
let cacheMiddleware = (duration) => {
  // console.log('cache!');
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    // console.log('cache key!:', key);
    let cacheContent = memCache.get(key);
    if (cacheContent) {
      // console.log('there is cache!');
      res.send(cacheContent);
      return
    } else {
      // console.log('there is NO cache!');
      res.sendResponse = res.send
      res.send = (body) => {
        memCache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }
}

// getUser function gets all the information needed to be rendered on user profiles
const getUser = async (req, username) => {
  let user;
  try {
    let ownBookList = await BookList.find({
      userId: req.user._id,
    });

    if (ownBookList != null) {
      ownBookList = ownBookList.map((el) => el.bookId);
      // console.log(ownBookList);
    }

    user = await User.findOne({
      username: username
    });

    booklist = await BookList.find({
      userId: user._id,
    });
    // console.log('booklist',booklist);
    let numMatchingBooks;
    if (booklist !== null && booklist !== undefined && booklist.length > 0) {
      numMatchingBooks = await BookList.aggregate([{
          $match: {
            userId: {
              $eq: user._id
            }
          }
        },
        {
          $group: { //calculate number matching books for each user
            _id: '$userId',
            matchingBooks: {
              $sum: {
                $cond: [{
                  $in: ["$bookId", ownBookList]
                }, 1, 0]
              }
            }
          }
        }
      ])
      // console.log('numMatchingBooks',numMatchingBooks);
      if (numMatchingBooks !== undefined) {
        numMatchingBooks = numMatchingBooks[0].matchingBooks;
      }
      // console.log('numMatchingBooks',numMatchingBooks);
    }

    let userInfo = {
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      gender: user.gender,
      bookGenre: user.bookGenre,
      description: user.description,
      languages: user.languages,
      friends: user.friends,
      userpicture: user.picture,
      usercountry: user.country,
      usercity: user.city,
      userfbID: user.fbID,
      userigID: user.igID,
      userslackID: user.slackID,
      usertwitterID: user.twitterID,
      isProfileOwner: req.params.username == req.user.username,
      bookList: booklist,
      bookArr: [],
      favBookArr: [],
      numMatchingBooks: ''
    }

    userInfo.numMatchingBooks = numMatchingBooks != undefined ? numMatchingBooks : '';

    for (book of userInfo.bookList) {
      let url = `https://www.googleapis.com/books/v1/volumes/${book.bookId}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.error) {
        console.log('json', json.error.message);
      }
      let volumeInfo = json.volumeInfo;

      volumeInfo.starred = book.starred;
      volumeInfo.added = true;
      volumeInfo.id = book.bookId;


      userInfo.bookArr.push(volumeInfo);
      // //bookList are just ids
      // let dbBook = await BookList.findOne({bookId: book});
      // console.log('volume Info:', volumeInfo);

      if (book.starred) {
        userInfo.favBookArr.push(volumeInfo);
      }
    }


    return userInfo;
  } catch (e) {
    console.log('getUser error:', e.message);
  }

}

const createBookList = async (userId, bookId, starred) => {
  try {
    bookList = new BookList({
      userId: userId,
      bookId: bookId,
      starred: starred
    })

    mybook = await bookList.save();
    console.log('The book was saved!', mybook);
    return mybook;
  } catch (e) {
    console.log('createBookList function error:', e.message);
  }

}

site.get('/', cacheMiddleware(30), (req, res, next) => {
  if (req.user !== null && req.user !== undefined) {
    if (req.user.role !== 'ADMIN') {
      res.redirect('/home');
    } else {
      res.redirect('/admin');
    }
  } else {
    res.redirect('/home');
  }

});

site.get('/home', (req, res, next) => {
  if (req.user !== null && req.user !== undefined) {
    if (req.user !== null && req.user !== undefined) {
      res.render('home', {
        layout: 'private-layout'
      });
      // res.json({message:'hey you'});
    } else {
      res.render('home');
      // res.json({message:'hey you'});
    }
  } else {
    // res.json({message:'hey you'});
    res.render('home');
  }
});

// //without params: render profile page for logged in user
site.get('/profile', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  let isOwner = true;
  let username = req.user.username;
  (async () => {
    try {
      let user = await getUser(req, username);
      let friendsInfo = await User.find({
        '_id': {
          $in: user.friends
        } 
      });

      
      if(user.bookArr.length <= 0){
        user.bookArr = undefined;
      }
      console.log('bookaRR',user.bookArr);

      res.render('profile', {
        layout: 'private-layout',
        username: user.username,
        gender: user.gender,
        bookGenre: user.bookGenre,
        description: user.description,
        languages: user.languages,
        favbooks: user.favBookArr,
        friends: friendsInfo,
        books: user.bookArr,
        firstname: user.firstname,
        lastname: user.lastname,
        userpicture: user.userpicture,
        usercountry: user.usercountry,
        usercity: user.usercity,
        userfbID: user.userfbID,
        userigID: user.userigID,
        userslackID: user.userslackID,
        usertwitterID: user.usertwitterID,
        isProfileOwner: isOwner,
        numMatchingBooks: user.numMatchingBooks
      });
    } catch (e) {
      console.log('GET /profile error:', e.message);
    }

  })();

});
// //with params: render profile page for the user listed in the request
site.get('/profile/:username', ensureLogin.ensureLoggedIn('/login'), (req, res) => {

  (async () => {
    try {
      let username = req.params.username;
      let user = await getUser(req, username);
      let isOwner = req.user.username === username;

      // console.log('userbooks', user.bookArr);
      res.render('profile', {
        layout: 'private-layout',
        username: user.username,
        gender: user.gender,
        bookGenre: user.bookGenre,
        description: user.description,
        languages: user.languages,
        favbooks: user.favBookArr,
        books: user.bookArr,
        firstname: user.firstname,
        lastname: user.lastname,
        userpicture: user.userpicture,
        usercountry: user.usercountry,
        usercity: user.usercity,
        userfbID: user.userfbID,
        userigID: user.userigID,
        userslackID: user.userslackID,
        usertwitterID: user.usertwitterID,
        isProfileOwner: isOwner,
        numMatchingBooks: user.numMatchingBooks
      });
    } catch (e) {
      console.log('GET /profile error:', e.message);
    }

  })();

});

site.get('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  User.findOne({
      // username: req.user.username
      _id: req.user._id
    })
    .then(user => {
      let tags = user.bookGenre.join();
      let needsUsername = (user.username=="" || user.username == undefined);
      let needsPassword = (user.password=="" || user.password == undefined);
      console.log(needsUsername);
      res.render('profileSetup', {
        layout: 'private-layout',
        username: user.username,
        description: user.description,
        bookGenre: tags,
        firstname: user.firstName,
        lastname: user.lastName,
        userpicture: user.picture,
        description: user.description,
        usercountry: user.country,
        usercity: user.city,
        userfbID: user.fbID,
        userigID: user.igID,
        userslackID: user.slackID,
        usertwitterID: user.twitterID,
        needsUsername: needsUsername,
        needsPassword:needsPassword
      });
    })
    .catch(err => console.log(err));
});

site.post('/profile-setup', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  if (req.body.tags) {
    // console.log('Tag was added!')
    let tags = req.body.tags;
    let data = JSON.parse(tags);

    let tagValues = [];

    for (el of data) {
      tagValues.push(...Object.values(el));
    }

    (async () => {
      try {
        let user = await User.findOne({
          // username: req.user.username
          _id: req.user._id
        });

        user.set({
          bookGenre: tagValues
        });

        user.save();
      } catch (e) {
        console.log('tags handler error on POST /profile-setup:', e.message);
      }
    })();

  } else if (req.body.removetags) {
    // console.log('Tag was removed!');
    let tags = req.body.removetags;
    // console.log('tags', tags);

    let tagValues = [];

    for (el of tags) {
      tagValues.push(...Object.values(el));
    }

    (async () => {
      try {
        let user = await User.findOne({
          // username: req.user.username
          _id: req.user._id
        });

        user.set({
          bookGenre: tagValues
        });

        user.save();
      } catch (e) {
        console.log('tags handler error on POST /profile-setup:', e.message);
      }
    })();
  } else {
    let updatedUser = {
      username: req.body.username,
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
        // username: updatedUser.username
        _id: req.user._id
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
          'N': true,
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
          username: updatedUser.username,
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
  }
});

site.get('/deleteProfile', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  User.deleteOne({'_id':req.user.id})
  .then(() => {
    res.redirect('/logout');
  })
  .catch((err)=> res.send(err));
})

site.get('/search', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  if (req.query.book != undefined) {
    const list = req.query.book.split(' ').join('+');
    console.log(req.query);
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

        if (req.user) {
          BookList.find({
              'userId': req.user._id,
              'bookId': {
                $in: bookIds
              }
            })
            .then(books => {
              let starredBooks = books.filter(book => book.starred);
              let booksDB = books;

              bookInfo = items.map(item => {
                return {
                  'id': item.id,
                  'image': item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'images/book_404.png',
                  'title': item.volumeInfo.title,
                  'subtitle': item.volumeInfo.subtitle,
                  'added': (() => {
                    for (let i = 0; i < booksDB.length; i++) {
                      if (item.id === booksDB[i].bookId) {
                        return true;
                      }
                    }
                  })(),
                  'starred': (() => {
                    for (let i = 0; i < starredBooks.length; i++) {
                      if (item.id === starredBooks[i].bookId) {
                        return true;
                      }
                    }
                  })()
                }
              });

              res.render('search', {
                layout: 'private-layout',
                bookInfo
              });
            })
            .catch(e => console.log(e.message));
        } else {
          bookInfo = items.map(item => {
            return {
              'id': item.id,
              'image': item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'images/book_404.png',
              'title': item.volumeInfo.title,
              'subtitle': item.volumeInfo.subtitle,
            }
          });
          res.render('search', {
            layout: 'private-layout',
            bookInfo
          });
        }
      }
    })
  } else {
    res.render('search', {
      layout: 'private-layout',
    });
  }
});

site.post('/search', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  const action = req.body.action;
  let errors = {};
  let messages = {};
  if (action.star || action.add) {
    BookList.findOne({
        'userId': req.user._id,
        'bookId': action.book
      })
      .then(data => {
        if (data === null) {
          console.log('There is no book on BookList collection');
          // if (req.user.starredBookLimit === 0 && action.star) {
          //   errors.bookLimit = `You can only have 5 books in your Favorite Books collection`;
          // }
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
                      console.log('savedBook:', book);
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
                  res.json({message:`You can only add 5 books to your Favorite's list`});
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
        if (book.starred) {
          User.findOneAndUpdate({
              '_id': req.user._id
            }, {
              'starredBookLimit': ++req.user.starredBookLimit
            })
            .then(user => {
              console.log('removed book and Updated User bookLimit');
            })
            .catch(e => console.log(e.message));
        }
        console.log('Book has been removed from collection:', book);
      })
      .catch(e => console.log(e.message));
  }

});

site.get('/book/:bookID' ,ensureLogin.ensureLoggedIn('/login') , (req, res, next) => {
  const url = `https://www.googleapis.com/books/v1/volumes/${req.params.bookID}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;
  let items;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let info = JSON.parse(body);
      res.render('book-detail', {
        book: info,
      })
      return;
    } else {
      res.send("Error!");
    }
  })
})

site.get('/matches', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
 
  let userSearch = req.query.username;

  (async () => {
    try {
      let bookList = await BookList.find({
        userId: req.user._id
      });

      let userInfo = await User.findOne({
        '_id': req.user._id
      });
      let myFriends = userInfo.friends;

      bookArr = bookList.map((el) => el.bookId)
      //Query DB for list of users with a count their respective number of matching books

      let matches = await User.aggregate([
                {
                  $match: {
                    _id: {$ne: req.user._id} //exclude own user --> disable for testing
                  }
                },
                {
                  $lookup: {
                    from: 'booklists',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'booklist'
                  }
                },
                {
                  $unwind: {
                    path: "$booklist",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $group: { //calculate number matching books for each user
                    _id: '$_id',
                    matchingBooks: {
                      $sum: {
                        $cond: [{
                          $in: ["$booklist.bookId", bookArr]
                        }, 1, 0]
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                  }
                },
                {
                  $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                  }
                },
              ]).sort({
                matchingBooks: -1
              }) //sort by number of matching books, descending


      for (match of matches) {
        let ad = await User.find({
          '_id': req.user._id,
          'friends': match._id
        });

        if (ad !== null && ad.length > 0) {
          match.user.added = true;
        }
      }

      let filteredMatches = [];

      matches.forEach((el) => {
        if (userSearch) {
          if (el.user.username.includes(userSearch)) filteredMatches.push(el);
        } else {
          if (el.matchingBooks > 0) filteredMatches.push(el)
        }
      });
      res.render('matches', {
        layout: 'private-layout',
        matches: filteredMatches
      });
    } catch (e) {
      console.log('GET /matches error:', e.message);
    }
  })();

});

site.post('/matches', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  const action = req.body.action;
  (async () => {
    try {
      if (action.add) {
        let user = await User.findOne({
          '_id': req.user._id,
          'friends': action.user
        });

        if (!user || user === null || user === undefined) {
          console.log('Friend not found!');
          user = await User.findOne({
            '_id': req.user._id,
          });

          user.friends.push(action.user);

          let updatedFriends = await user.set({
            friends: user.friends
          });
          console.log('You added a Friend! friends:', updatedFriends.friends);

          updatedFriends.save();
        } else {
          res.json({message:`This user is already added to your Friends`});
          console.log('This user is already added to your Friends');
        }

      } else if (action.remove) {
        user = await User.findOne({
          '_id': req.user._id,
        });

        let removed = user.friends.splice(action.user, '');

        let updatedFriends = await user.set({
          friends: removed
        });

        console.log('You removed a Friend! friends:', updatedFriends.friends);
        res.json({message:`You removed a Friend`});

        updatedFriends.save();
      }
    } catch (e) {
      console.log('POST /matches error:', e.message);
    }
  })()

})

site.get('/inbox', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  const user = req.user;

  (async () => {
    try {
      let errors = {};
      let messages = await Message.find({
        to: user.username
      });
      let sentmessages = await Message.find({
        from: user.username
      });

      if (messages.length === 0 || messages === null) {
        errors.inbox = "You have no messages :(";
      } 

      if (sentmessages.length === 0 || sentmessages === null) {
        errors.sent = "You have not sent any messages :(";
      } 

      res.render("inbox", {
        layout: 'private-layout',
        messages,
        sentmessages,
        errors
      });

    } catch (e) {
      console.log('Error on GET /inbox', e.message);
    }
  })();
})
site.post('/inbox', ensureLogin.ensureLoggedIn('/login'), (req, res, next) => {
  let to, from, message;
  (async () => {
    let action = req.body.action;
    try {
      if (action.send) {
        if (action.to) {
          from = req.user.username;
          message = action.message;

          to = action.to;

          let toUser = await User.findOne({
            'username': to
          });

          if (toUser === null) {
            console.log('User not found');
            res.json({message:`User is not found`});
            throw new Error(`User not found: The user you want to send the message to doesn't exist`);
          }
          if (message === null) {
            res.json({message:`You didn't write anything on the message`});
            console.log(`You didn't write anything on the message`);
            throw new Error(`Empty Message: write a message to send`);
          }

          let sendMessage = await new Message({
            to: to,
            message: message,
            from: from,
            senderId: req.user._id,
            receiverId: toUser._id
          })

          console.log(sendMessage);

          sendMessage.save();

        } else {
          throw new Error('No username', 'Please put a username to send your message');
        }
      } else if (action.delete) {
        if (!action.many) {
          let messageId = action.messageId;
          let deletedMessage = await Message.findByIdAndDelete({
            '_id': messageId
          });
          console.log('Message deleted!', deletedMessage._id);
          res.json({message:'Message deleted!'});
        } else {
          let messageIds = action.messageIds;
          let deletedMessages = await Message.deleteMany({
            '_id': {
              $in: messageIds
            }
          });
          console.log('Messages deleted!', deletedMessages);
          res.json({message:'Messages deleted!'});
        }
      }
    } catch (e) {
      console.log('Error on POST /inbox:', e.message)
    }
  })()

  
})

site.get('/test',(req, res, next) => {
  res.json('hello');
})



module.exports = site;