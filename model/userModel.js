var userSchema = require('./schemas/userSchema');
var db = require('./../utils').db;

module.exports = db.model('User', userSchema);
 
// vim: sw=2 ts=2 et
