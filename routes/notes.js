var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');
var notesCollection = require('../libs/notesCollection');

function sync(req, res){
  var user = req.session.user;
  // Get NA & INB notebooks
  // Get the notes from these notebooks.
};
module.exports.sync = sync;

// vim: sw=2 ts=2 et
