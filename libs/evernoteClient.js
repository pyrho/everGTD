var Promise = require('bluebird');
var config = require('../config.json');
var Evernote = require('evernote').Evernote;
var logger = require('./logger');
var e = require('evernote');
var NoteFilter = e.Evernote.NoteFilter;
var NotesMetadataResultSpec = e.Evernote.NotesMetadataResultSpec;
var enml = require('enml-js');
var notesCollection = require('./notesCollection');


function evernoteClient(){
  this._client = undefined;
  this._accessToken = undefined;

  // Functions
  this.initialize = function(accessToken){
    if(this._client){
      logger.debug('evernoteClient already initialized');
      return;
    }
    logger.debug('initializing evernote client');
    this._accessToken = accessToken;
    this._client = new Evernote.Client({
      token: this._accessToken,
      sandbox: config.SANDBOX
    });
  };

  this.getClient = function(session){
    if(this._client){
      return this._client;
    }
    else{
      this.initialize(session.oauthAccessToken);
      return this._client;
    }
  };

  this.getNotesFromNotebook = function(session, notebookGuid, startIndex){
    var self = this;
    var notes = [];
    return new Promise(function(resolve, reject){
      var client = self.getClient(session);
      var noteStore = Promise.promisifyAll(client.getNoteStore());
      var filter = new NoteFilter();
      var rspec = new NotesMetadataResultSpec();
      rspec.includeTitle = true;
      filter.notebookGuid = notebookGuid;

      startIndex = startIndex || 0;
      logger.debug('Getting notes from ' + startIndex);
      noteStore.findNotesMetadataAsync(self._accessToken, filter, startIndex, 32000, rspec).error(function(e){
        return reject(e);
      }).then(function(notesData){
        notesData.notes.forEach(function(note){
          logger.debug('Pushing note: ' + note.title);
          notes.push(note);
        });
        var totalNumberOfNotes = notesData.totalNotes;
        if(notes.length < totalNumberOfNotes){
          logger.debug('LOOPING, current notes #: ' + notes.length + ', total# ' + notesData.totalNotes);
          logger.debug('    Notes:' + JSON.stringify(notes));
          return self.getNotesFromNotebook(session, notebookGuid, startIndex + notesData.notes.length).done(function(notes){
            resolve(notes);
          });
        }
        else{
          logger.debug('Got all notes!');
          resolve(notes);
        }
      });
    });
  };

  this.getNotesList = function(session, notebookGuid){
    var self = this;
    return new Promise(function(resolve, reject){
      // Get cached data
      notesCollection.getUserNotes(session.userId)
      .error(reject)
      .done(function(notes){
        if(notes && notes.length > 0){
          logger.debug('Got cached notes');
          resolve(notes);
        }
        else{
          logger.debug('Fetching from evernoe');
          self.getNotesFromNotebook(session, notebookGuid)
          .error(reject)
          .done(function(notes){
            self.getNotesData(notes).done(function(notesWithContent){

              notesCollection.storeUserNotes(session.userId, notesWithContent)
              .error(reject);

              resolve(notesWithContent);
            });
          });
        }
      });

    });
  };

  this.getNoteTag = function(noteGuid){
    var self = this;
    return new Promise(function(resolve, reject){
      var client = self.getClient();
      var noteStore = Promise.promisifyAll(client.getNoteStore());
      return noteStore.getNoteTagNamesAsync(self._accessToken, noteGuid).error(function(e){
        reject(e);
      }).done(function(tags){
        resolve(tags);
      });
    });
  };

  this.getNoteContent = function(noteGuid){
    var self = this;
    return new Promise(function(resolve, reject){
      var client = self.getClient();
      var noteStore = Promise.promisifyAll(client.getNoteStore());

      logger.debug('Getting note data for ' + noteGuid);
      noteStore.getNoteAsync(self._accessToken, noteGuid, true, false, false, false).error(function(e){
        return reject(e);
      }).done(function(noteWithContent){
        noteWithContent.content = enml.PlainTextOfENML(noteWithContent.content);
        resolve(noteWithContent);
      });
    });
  };

  this.getNotesData = function(notesList){
    var self = this;
    return new Promise(function(resolve, reject){
      Promise.map(notesList, function(note){
        return Promise.all([
          self.getNoteContent(note.guid),
          self.getNoteTag(note.guid)
        ]).spread(function(noteContent, noteTags){
          return {
            tags: noteTags,
            guid: note.guid,
            title: note.title,
            content: noteContent.content
          };
        });
      }).then(function(notes){
        return resolve(notes);
      }).error(function(e){
        console.log('>>>> ' + e);
        return reject(e);
      });
    });
  };

}

var thisClient = new evernoteClient();
module.exports = thisClient;

// vim: sw=2 ts=2 et
