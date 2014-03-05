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
    if(!accessToken){
      logger.debug('evernoteClient not initializing because accessToken is null');
      return;
    }
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

  this.getClient = function(){
    if(this._client){
      return this._client;
    }

    throw new Error('This should never happend, session must be initialzed at login or at account binding');
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
      noteStore.findNotesMetadataAsync(self._accessToken, filter, startIndex, 32000, rspec)
      .then(function(notesData){
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
      })
      .error(reject);
    });
  };

  this.getNotesList = function(session, notebookGuid){
    if(!notebookGuid){
      return Promise.reject(new Error('notebookGuid is undefined'));
    }
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
    var client = self.getClient();
    var noteStore = Promise.promisifyAll(client.getNoteStore());
    return noteStore.getNoteTagNamesAsync(self._accessToken, noteGuid);
  };

  this.getNoteContent = function(noteGuid){
    var self = this;
    return new Promise(function(resolve, reject){
      var client = self.getClient();
      var noteStore = Promise.promisifyAll(client.getNoteStore());

      logger.debug('Getting note data for ' + noteGuid);
      noteStore.getNoteAsync(self._accessToken, noteGuid, true, false, false, false)
      .error(reject)
      .done(function(noteWithContent){
        noteWithContent.content = enml.PlainTextOfENML(noteWithContent.content);
        resolve(noteWithContent);
      });
    });
  };

  this.getNotesData = function(notesList){
    var self = this;
    return Promise.map(notesList, function(note){
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
    });
  };

}

var thisClient = new evernoteClient();
module.exports = thisClient;

// vim: sw=2 ts=2 et
