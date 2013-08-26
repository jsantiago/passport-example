#!/usr/bin/env node

// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------
var express = require('express');
var path = require('path');
var cons = require('consolidate');
var swig = require('swig');

var config = require('./config.json');
var info = require('./package.json');

// -----------------------------------------------------------------------------
// mongo
// -----------------------------------------------------------------------------
var mongoose = require('mongoose');
mongoose.connect(config.mongo.uri);

var db = mongoose.connection;
db.on('error', console.error.bind(console, "Connection error:"));
db.on('open', function(){
    console.log("Connected to Mongo");
});

var userProfileSchema = new mongoose.Schema({
    provider: String,
    id: String,
    displayName: String,
    name: { familyName: String, givenName: String, middleName: String },
    emails: [{ value: String }],
    photos: [{ value: String }]
});
userProfileSchema.index({ id: 1 });

var UserProfile = mongoose.model('userprofiles', userProfileSchema);

// -----------------------------------------------------------------------------
// Passport
// -----------------------------------------------------------------------------
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new GoogleStrategy(
    {
        returnURL: config.origin + "/auth/google/return",
        realm: config.origin
    },
    function(identifier, profile, done){
        UserProfile.findOne({id: identifier}, function(err, user){
            if (err) throw err;
            if (!user) {
                profile.id = identifier;
                profile.provider = "Google";
                user = new UserProfile(profile);
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
        callbackURL: config.origin + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
        UserProfile.findOne({id: profile.id}, function(err, user){
            if (err) throw err;
            if (!user) {
                profile.provider = "Twitter";
                user = new UserProfile(profile);
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

passport.use(new FacebookStrategy(
    {
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.origin + "/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        UserProfile.findOne({id: profile.id}, function(err, user){
            if (err) throw err;
            if (!user) {
                profile.provider = "Facebook";
                user = new UserProfile(profile);
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
    UserProfile.findOne({id: id}, function(err, user){
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
        title: "Passport Example",
        name: info.name,
        version: info.version
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
        var data = {
            title: "Login",
            name: info.name,
            version: info.version
        };
        res.render("login", data);
    }
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// Redirect the user to Google for authentication.
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.
app.get('/auth/google/return',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

// Redirect the user to Twitter for authentication.
app.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

// Redirect the user to Facebook for authentication.
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

// -----------------------------------------------------------------------------
// Start it up!
// -----------------------------------------------------------------------------
app.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
