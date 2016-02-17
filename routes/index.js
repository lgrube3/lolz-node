var express = require('express');
var multer = require('multer');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');
var Picture = mongoose.model('Picture');
var jwt = require('express-jwt');
var aws = require('aws-sdk');

var done = false;

var auth = jwt({
    secret: 'SECRET',
    userProperty: 'payload'
});

//var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_ACCESS_KEY = 'AKIAIDW6EPFKX3JL5IOQ';

//var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var AWS_SECRET_KEY = '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';

//var S3_BUCKET = process.env.S3_BUCKET;
var S3_BUCKET = 'lolz-uploads';

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

router.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }

    passport.authenticate('local-login', function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.post('/register', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }
    passport.authenticate('local-signup', function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
// route for facebook authentication and login
router.get('/auth/facebook', function(req, res, next) {

    passport.authenticate('facebook', {
        scope: 'email'
    }, function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

// handle the callback after facebook has authenticated the user
router.get('/auth/facebook/callback', function(req, res, next) {
    passport.authenticate('facebook', {
        successRedirect: '/#/profile',
        failureRedirect: '/'
    }, function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});



//UPLOAD PICTURE

router.use(multer({
    dest: './public/uploads/',
    rename: function(fieldname, filename) {
        return filename + Date.now();
    },
    onFileUploadStart: function(file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function(file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done = true;
    }
}));

router.get('/users', auth, function(req, res, next) {
    User.find(null, {
        hash: 0,
        salt: 0,
        __v: 0
    }, function(err, users) {
        if (err) {
            return next(err);
        }

        res.json(users);
    });
});

router.get('/user', auth, function(req, res, next) {
    // Find user and return user data
    User.findOne({
        username: req.payload.username
    }, {
        hash: 0,
        salt: 0,
        __v: 0
    }, function(err, user) {
        if (err) {
            return next(err);
        }
        res.json(user);
    });
});

router.put('/user', auth, function(req, res, next) {
    User
        .findOne({
            username: req.payload.username
        })
        .exec(function(err, user) {
            if (err) {
                return next(err);
            }
            user.displayname = req.body.displayname;
            user.save(function(err) {
                if (err) {
                    return next(err);
                }
                res.json(user);
            });
        });
});

router.get('/myscore', auth, function(req, res, next) {
    //Respond with user score
    User.findOne({
        username: req.payload.username
    }, function(err, user) {
        if (err) {
            return next(err);
        }
        if (user.score === undefined) {
            res.json({
                score: 0
            });
        } else {
            res.json({
                score: user.score
            });
        }

    });
});

router.get('/myrank', auth, function(req, res, next) {
    User
        .find()
        .where('likes').gt(0)
        .sort({
            likes: -1
        })
        .exec(function(err, users) {
            if (err) {
                return next(err);
            }
            //res.json(users);
            var rank = 0;
            for (i = 0; i < users.length; i++) {
                if (users[i].username == req.payload.username) {
                    rank = i + 1;
                }
            }
            res.json({
                rank: rank
            })
        });
});

router.get('/mylikes', auth, function(req, res, next) {

    User.findOne({
        username: req.payload.username
    }, function(err, user) {
        if (err) {
            return next(err);
        }
        res.json({
            mylikes: user.likes
        });

    });
});

router.get('/mypictures', auth, function(req, res, next) {
    // Find user and return user data
    Picture.find({
        uploader: req.payload.username
    }, function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.get('/pictures', auth, function(req, res, next) {
    Picture.find(function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.get('/picture', auth, function(req, res, next) {
    var query = {
        rated_by: {
            $ne: req.payload.username
        }
    };
    Picture.count(query, function(err, count) {
        var n = count;
        var r = Math.floor(Math.random() * n);
        Picture.find(query).limit(1).skip(r).exec(function(err, pictures) {
            if (err) {
                return next(err);
            }
            res.json(pictures);
        });
    });
});

router.get('/firstpictureinstack', function(req, res, next) {
    Picture.find().sort('-upload_date').limit(1).exec(function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.get('/firstpictureset', function(req, res, next) {
    Picture.find().sort('-upload_date').limit(3).exec(function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.post('/repeatpictureset', function(req, res, next) {
    Picture.find({
            _id: {
                $lt: req.body._id
            }
        })
        .sort('-upload_date')
        .limit(3)
        .exec(function(err, pictures) {
            if (err) {
                return next(err);
            }
            res.json(pictures);
        });
});

router.get('/picturesanon', function(req, res, next) {
    Picture.find(function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.get('/pictureanon', function(req, res, next) {

    Picture.count(function(err, count) {
        var n = count;
        var r = Math.floor(Math.random() * n);
        Picture.find().limit(1).skip(r).exec(function(err, pictures) {
            if (err) {
                return next(err);
            }
            res.json(pictures);
        });
    });
});

router.post('/picture', auth, function(req, res, next) {
    if (done == true) {

        // Find user that uploaded image and save picture to the user's pictures
        User.findOne({
            username: req.payload.username
        }, function(err, user) {
            if (err) {
                return next(err);
            }

            // Create the picture object
            var picture = new Picture(req.body);
            picture.filename = req.files.file.name;
            picture.uploader = req.payload.username;
            picture.upload_date = new Date();

            // Save the picture object to the array of pictures
            picture.save(function(err) {
                if (err) {
                    return next(err);
                }
                console.log(req.files);
                res.json(req.files);
            });
        });
    }
});

router.get('/myfavorites', auth, function(req, res, next) {
    Picture.find({
        liked_by: req.payload.username
    }).exec(function(err, pictures) {
        if (err) {
            return next(err);
        }
        res.json(pictures);
    });
});

router.get('/sign_s3', auth, function(req, res) {
    aws.config.update({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY
    });
    var s3 = new aws.S3();
    var s3_params = {
        Bucket: S3_BUCKET,
        Key: req.query.file_name,
        Expires: 60,
        ContentType: req.query.file_type,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            var return_data = {
                signed_request: data,
                url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + req.query.file_name
            };

            // Create the picture object
            var picture = new Picture(req.body);
            picture.filename = return_data.url;
            picture.uploader = req.payload.username;
            picture.upload_date = new Date();

            // Save the picture object to the array of pictures
            picture.save(function(err) {
                if (err) {
                    return next(err);
                }
                console.log(req.files);
                res.write(JSON.stringify(return_data));
                res.end();
            });


        }
    });
});

router.param('picture_id', function(req, res, next, id) {
    var query = Picture.findById(id);

    query.exec(function(err, picture) {
        if (err) {
            return next(err);
        }
        if (!picture) {
            return next(new Error('can\'t find picture'));
        }

        req.picture = picture;
        return next();
    });
});

router.get('/picture/:picture_id', function(req, res, next) {
    res.json(req.picture);
});

router.delete('/picture/:picture_id', auth, function(req, res, next) {
    Picture.remove({
        _id: req.picture._id
    }, function(err, picture) {
        if (err)
            res.send(err);

        res.json({
            message: 'Successfully deleted'
        });
    });
});

router.put('/picture/:picture_id/like', auth, function(req, res, next) {
    var liked = false;
    for (i = 0; i < req.picture.liked_by.length; i++) {
        if (req.picture.liked_by[i] === req.payload.username) {
            liked = true;
        }
    }
    if (liked) {
        res.json(req.picture);
    } else {
        req.picture.like(function(err, picture) {
            if (err) {
                return next(err);
            }
            picture.liked_by.push(req.payload.username);
            picture.save(function(err) {
                if (err) {
                    return next(err);
                }
                calcUserLikes(picture.uploader, next);
                //calcUserScore(picture.uploader, next);
                res.json(picture);
            });
        });
    }



});

router.put('/picture/:picture_id/unlike', auth, function(req, res, next) {
    var liked = false;
    for (i = 0; i < req.picture.liked_by.length; i++) {
        if (req.picture.liked_by[i] === req.payload.username) {
            liked = true;
        }
    }
    if (liked) {
        req.picture.unlike(function(err, picture) {
            if (err) {
                return next(err);
            }
            for (var i = req.picture.liked_by.length - 1; i >= 0; i--) {
                if (req.picture.liked_by[i] === req.payload.username) {
                    req.picture.liked_by.splice(i, 1);
                    // break;       //<-- Uncomment  if only the first term has to be removed
                }
            }
            picture.save(function(err) {
                if (err) {
                    return next(err);
                }
                //calcUserScore(picture.uploader, next);
                calcUserLikes(picture.uploader, next);
                res.json(picture);
            });
        });
    } else {
        res.json(req.picture);
    }

});

router.put('/picture/:picture_id/dislike', auth, function(req, res, next) {
    req.picture.dislike(function(err, picture) {
        if (err) {
            return next(err);
        }
        picture.rated_by.push(req.payload.username);
        picture.disliked_by.push(req.payload.username);
        picture.save(function(err) {
            if (err) {
                return next(err);
            }
            calcUserScore(picture.uploader, next);
            res.json(picture);
        });
    });

});

router.put('/picture/:picture_id/likeanon', function(req, res, next) {
    req.picture.like(function(err, picture) {
        if (err) {
            return next(err);
        }
        calcUserScore(picture.uploader, next);
        res.json(picture);
    });

});

router.put('/picture/:picture_id/dislikeanon', function(req, res, next) {
    req.picture.dislike(function(err, picture) {
        if (err) {
            return next(err);
        }
        calcUserScore(picture.uploader, next);
        res.json(picture);
    });

});

calcUserScore = function(uploader, next) {
    //find all pictures by user and average their scores
    Picture.find({
        uploader: uploader
    }, function(err, pictures) {
        if (err) {
            return next(err);
        }
        var score = 0;
        var numOfPicsToScore = 0;
        for (i = 0; i < pictures.length; i++) {
            if (pictures[i].score !== 0 || pictures[i].dislikes !== 0) {
                score += pictures[i].score;
                numOfPicsToScore += 1;
            }
        }
        score = score / numOfPicsToScore;

        //SAVE SCORE TO USER OBJECT
        User.findOne({
            username: uploader
        }, function(err, user) {
            if (err) {
                return next(err);
            }
            if (score > 0) {
                user.score = score;
                user.save(function(err) {
                    if (err) {
                        return next(err);
                    }
                });
            }
        });
    });
}

calcUserLikes = function(uploader, next) {
    Picture
        .find({
            uploader: uploader
        })
        .exec(function(err, pictures) {
            if (err) {
                return next(err);
            }
            var likes = 0;
            for (i = 0; i < pictures.length; i++) {
                likes += pictures[i].likes;
            }

            //SAVE LIKES TO USER OBJECT
            User.findOne({
                username: uploader
            }, function(err, user) {
                if (err) {
                    return next(err);
                }
                user.likes = likes;
                user.save(function(err) {
                    if (err) {
                        return next(err);
                    }
                });
            });
        });
}

/*router.get('/leaderboard', function(req, res, next) {
    User
        .find()
        .where('score').gt(0)
        .sort({
            score: -1
        })
        .limit(100)
        .exec(function(err, users) {
            if (err) 
                return next(err);
            }
            //res.json(users);
            res.json(users)
        });
});*/

router.get('/leaderboard', function(req, res, next) {
    User
        .find()
        .where('likes').gt(0)
        .sort({
            likes: -1
        })
        .limit(100)
        .exec(function(err, users) {
            if (err) {
                return next(err);
            }
            //res.json(users);
            res.json(users);
        });
});


module.exports = router;
