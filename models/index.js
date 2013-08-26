// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------
var config = require('../config.json');

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

module.exports.UserProfile = require('./userProfile');
