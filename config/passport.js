var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use('local-login', new LocalStrategy(
    function(username, password, done) {
        User.findOne({
            username: new RegExp(username, "i")
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Email address not found. Click on the link below to sign up!' 
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, {
                    message: 'Incorrect password'
                });
            }
            return done(null, user);
        });
    }
));

passport.use('local-signup', new LocalStrategy(
    function(username, password, done) {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (user) {
                return done(null, false, {
                    message: 'Email address already in use'
                });
            } else {
                var user = new User();

                user.username = username;

                user.setPassword(password)

                user.save(function(err) {
                    if (err) {
                        return next(err);
                    }
                    return done(null, user);
                });
            }

        });
    }
));

passport.use(new FacebookStrategy({
        clientID: 693585247436754,
        clientSecret: "074c156ce7c8e53f7bdaaf6aecc7ee3d",
        callbackURL: "http://localhost:8080/#/"
    },
    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({
                'facebook.id': profile.id
            }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }
));
