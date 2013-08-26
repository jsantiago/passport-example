#!/usr/bin/env node

// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------
var express = require('express');
var path = require('path');
var http = require('http');
var cons = require('consolidate');
var swig = require('swig');

var config = require('./config.json');
var models = require('./models');

// -----------------------------------------------------------------------------
// Passport
// -----------------------------------------------------------------------------
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

passport.use(new GoogleStrategy(
    {
        returnURL: config.baseUrl+':'+config.port+'/auth/google/return',
        realm: config.baseUrl+':'+config.port+'/'
    },
    function(identifier, profile, done){
        models.UserProfile.findOne({id: identifier}, function(err, user){
            if (err) throw err;
            if (!user) {
                profile.id = identifier;
                profile.provider = "Google";
                user = new models.UserProfile(profile);
                user.save(function(err, user){
                    if (err) throw err;
                    done(err, user);
                });
            }
            else {
                done(err, user);
            }
        });
    }
));

passport.use(new TwitterStrategy(
    {
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: config.baseUrl+':'+config.port+"/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
        models.UserProfile.findOne({id: profile.id}, function(err, user){
            if (err) throw err;
            if (!user) {
                profile.provider = "Twitter";
                user = new models.UserProfile(profile);
                user.save(function(err, user){
                    if (err) throw err;
                    done(err, user);
                });
            }
            else {
                done(err, user);
            }
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    models.UserProfile.findOne({id: id}, function(err, user){
        done(null, user);
    });
});

// -----------------------------------------------------------------------------
// Create the app
// -----------------------------------------------------------------------------
var app = express();
app.configure(function(){
    app.set('port', process.env.PORT || config.port);

    // assign the swig engine to .html files
    app.engine('html', cons.swig);

    // set .html as the default extension
    app.set('view engine', 'html');

    // setup views dir
    swig.init({
        root: __dirname + '/views',
        allowErrors: true
    });
    app.set('views', __dirname + '/views');

    app.use(express.favicon());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ secret: config.session.secret }));
    app.use(express.logger('dev'));

    // Add Passport
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(express.methodOverride());

    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.get("/", function(req, res){
    var data = {
        title: "Passport Example"
    };

    if (req.isAuthenticated()) {
        data.user = req.user
    }

    res.render("index", data);
});

app.get('/login', function(req, res){
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render("login");
    }
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// Redirect the user to Google for authentication.
// When complete, Google will redirect the user back to the application at:
//     /auth/google/return
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.
// Finish the process by verifying the assertion.
// If valid, the user will be logged in.
// Otherwise, authentication has failed.
app.get('/auth/google/return',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

// Redirect the user to Twitter for authentication.
// When complete, Twitter will redirect the user back to the application at
//   /auth/twitter/callback
app.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.
// Finish the authentication process by attempting to obtain an access token.
// If access was granted, the user will be logged in.
// Otherwise, authentication has failed.
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

// -----------------------------------------------------------------------------
// Start it up!
// -----------------------------------------------------------------------------
http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
