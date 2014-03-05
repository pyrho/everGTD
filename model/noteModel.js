var noteSchema = require('./schemas/noteSchema');
var db = require('./../utils').db;

module.exports = db.model('Note', noteSchema);
 
// vim: sw=2 ts=2 et


