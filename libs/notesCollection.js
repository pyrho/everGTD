var Promise = require('bluebird');
Promise.longStackTraces();
var config = require('../config.json');
var db = require('monk')(config.mongo.host + '/everGTD');
var logger = require('./logger');
var notesCollection = db.get('notes');

module.exports.getUserNotes = function(userId){
  return new Promise(function(resolve, reject){
    notesCollection.findOne({userId: userId})
      .success(function(userData){
        resolve((userData && userData.notes) || []);
      })
      .on('error', reject);
  });
};

module.exports.storeUserNotes = function(userId, notes){
  return new Promise(function(resolve, reject){
    logger.debug('Storing notes');
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


module.exports.moveNoteDown = function(userId, noteGuid){
  return new Promise(function(resolve, reject){
    if(!userId || !noteGuid){
      return reject(new Error("Invalid parameters"));
    }

    module.exports.getUserNotes(userId)
      .error(function(e){
        return reject(new Error("Failed querying DB"));
      })
      .done(function(notes){
        var i, oldIdx;
          for(i = 0; i < notes.length; ++i){
            if(notes[i].guid == noteGuid){
              if(i == (notes.length - 1)){
                return reject(new Error("Already at max index"));
              }
              var tmpSwap = notes[i + 1];
              notes[i + 1] = notes[i];
              notes[i] = tmpSwap ;
              return resolve(module.exports.storeUserNotes(userId, notes));
            }                    
          }
          return reject(new Error("Note not found"));
      });
  });
};


module.exports.moveNoteUp = function(userId, noteGuid){
  return new Promise(function(resolve, reject){
    if(!userId || !noteGuid){
      return reject(new Error("Invalid parameters"));
    }

    module.exports.getUserNotes(userId)
      .error(function(e){
        return reject(new Error("Failed querying DB"));
      })
      .done(function(notes){
        var i, oldIdx;
          for(i = 0; i < notes.length; ++i){
            if(notes[i].guid == noteGuid){
              if(i == 0){
                return reject(new Error("Already at index 0"));
              }
              var tmpSwap = notes[i - 1];
              notes[i-1] = notes[i];
              notes[i] = tmpSwap ;
              return resolve(module.exports.storeUserNotes(userId, notes));
            }                    
          }
          return reject(new Error("Note not found"));
      });
  });
};

// vim: sw=2 ts=2 et
