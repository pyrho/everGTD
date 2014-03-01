var Promise = require('bluebird');
Promise.longStackTraces();
var config = require('../config.json');
var db = require('monk')(config.mongo.host + '/everGTD');
var logger = require('./logger');
var notesCollection = db.get('notes');

module.exports.deleteUserNotes = function(userId){
  return new Promise(function(resolve, reject){
    notesCollection.remove({userId: userId})
    .success(function(){
      resolve();
    })
    .on('error', reject);
  });
};

function getUserNotes(userId){
  return new Promise(function(resolve, reject){
    notesCollection.findOne({userId: userId})
      .success(function(userData){
        resolve((userData && userData.notes) || []);
      })
      .on('error', reject);
  });
}
module.exports.getUserNotes = getUserNotes;

function storeUserNotes(userId, notes){
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
}
module.exports.storeUserNotes = storeUserNotes;

function getNoteIndex(notes, noteGuid){
  for(var i = 0; i < notes.length; ++i){
    if(notes[i].guid === noteGuid){
      return i;
    }
  }
  return -1;
}

function moveNote(notes, userId, oldIx, newIx){
  var swappee = notes[newIx];
  notes[newIx] = notes[oldIx];
  notes[oldIx] = swappee;
  return storeUserNotes(userId, notes);
}


module.exports.moveNoteDown = function(userId, noteGuid){
  if(!userId || !noteGuid){
    return Promise.reject(new Error('Invalid parameters'));
  }

  return new Promise(function(resolve, reject){
    module.exports.getUserNotes(userId)
      .error(function(e){
        return reject(new Error('Failed querying DB: ' + e));
      })
      .done(function(notes){
        var noteIndex = getNoteIndex(notes, noteGuid);
        if(noteIndex === -1){
          return reject(new Error('Note not found'));
        }
        if(noteIndex === notes.length - 1){
          return reject(new Error('Note already at bottom'));
        }
        return resolve(moveNote(notes, userId, noteIndex, noteIndex + 1));
      });
  });
};


module.exports.moveNoteUp = function(userId, noteGuid){
  if(!userId || !noteGuid){
    return Promise.reject(new Error('Invalid parameters'));
  }

  return new Promise(function(resolve, reject){
    module.exports.getUserNotes(userId)
      .error(function(e){
        return reject(new Error('Failed querying DB: ' + e));
      })
      .done(function(notes){
        var noteIndex = getNoteIndex(notes, noteGuid);
        if(noteIndex === -1){
          return reject(new Error('Note not found'));
        }
        if(noteIndex === 0){
          return reject(new Error('Note already at top'));
        }
        return resolve(moveNote(notes, userId, noteIndex, noteIndex - 1));
      });
  });
};

// vim: sw=2 ts=2 et
