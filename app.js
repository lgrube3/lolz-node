var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');

require('./models/users');
require('./models/pictures');
require('./config/passport');

var passport = require('passport');

// DEV
// Username is my email address -- Mongolab
mongoose.connect('mongodb://funnypictures:Evolution9@ds033217.mongolab.com:33217/funnypictures');

// PROD
// Username is my email address -- Mongolab
//mongoose.connect('mongodb://lolzuser:Evolution9@ds031812.mongolab.com:31812/lolz');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//prerender
app.use(require('prerender-node').set('prerenderToken', 'Ugjil9yJKo36tlZM8LwH'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Expires, Pragma, Cache-Control, Origin, X-Requested-With, Authorization, Content-Type, Accept");
    next();
});

app.use('/api', routes);

//app.use('/assets', express.static(__dirname + '/assets'));

app.all('/login', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/index.html', {
        root: __dirname
    });
});

app.all('/register', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/index.html', {
        root: __dirname
    });
});

app.all('/profile', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/index.html', {
        root: __dirname
    });
});

app.all('/leaderboard', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/index.html', {
        root: __dirname
    });
});

app.all('/img/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/index.html', {
        root: __dirname
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
