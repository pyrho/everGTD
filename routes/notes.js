var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');
var notesCollection = require('../libs/notesCollection');

module.exports.sync = function(req, res){
  var user = req.session.user;
  // Get NA & INB notebooks
  // Get the notes from these notebooks.

};

// vim: sw=2 ts=2 et
