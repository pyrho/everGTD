var Promise = require('bluebird');
var config = require('../config.json');
var db = require('monk')(config.mongo.host + '/everGTD');
var logger = require('./logger');

module.exports.getUserNotes = function(userId){
  return new Promise(function(resolve, reject){
    var notesCollection = db.get('notes');
    notesCollection.findOne({userId: userId})
      .success(function(userData){
        resolve(userData.notes);
      })
      .on('error', reject);
  });
};

module.exports.storeUserNotes = function(userId, notes){
  return new Promise(function(resolve, reject){
    logger.debug('Storing notes');
    var notesCollection = db.get('notes');
    notesCollection.update({
      userId: userId
    },{
      '$set':{
        notes: notes
      }
    },
    {upsert: true})
    .success(resolve)
    .on('error', reject);
  });
};

// vim: sw=2 ts=2 et
