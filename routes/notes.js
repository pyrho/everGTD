var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var UserModel = require('../model/userModel');
var notesCollection = require('../libs/notesCollection');

function sync(req, res){
  UserModel.getUserById(req.session.userId)
    .then(function(user){
    })
    .error(function(e){
    });
  
  // Get NA & INB notebooks
  // Get the notes from these notebooks.
};
module.exports.sync = sync;

// vim: sw=2 ts=2 et
