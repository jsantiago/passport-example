var mongoose = require('mongoose');

var userProfileSchema = new mongoose.Schema({
    provider: String,
    id: String,
    displayName: String,
    name: { familyName: String, givenName: String, middleName: String },
    emails: [{ value: String }],
    photos: [{ value: String }]
});
userProfileSchema.index({ id: 1 });

module.exports = mongoose.model('users', userProfileSchema);
