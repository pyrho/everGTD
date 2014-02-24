var Promise = require('bluebird');
var config = require('../config.json');
var Evernote = require('evernote').Evernote;
var logger = require('./logger');
var e = require('evernote');
var NoteFilter = e.Evernote.NoteFilter;
var NotesMetadataResultSpec = e.Evernote.NotesMetadataResultSpec;
var enml = require('enml-js');


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

  this.getNotesList = function(session, notebookGuid){
    var self = this;
    return new Promise(function(resolve, reject){
      var client = self.getClient(session);
      var noteStore = Promise.promisifyAll(client.getNoteStore());
      var filter = new NoteFilter();
      var rspec = new NotesMetadataResultSpec();
      rspec.includeTitle = true;
      filter.notebookGuid = notebookGuid;

      var notes = [];
      function getNotesRec(startIndex){
        return new Promise(function(resolve){
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
              return getNotesRec(startIndex + notesData.notes.length).done(function(notes){
                resolve(notes);
              });
            }
            else{
              logger.debug('Got all notes!');
              resolve(notes);
            }
          });
        });
      }

      getNotesRec(0).error(function(e){
        return reject(e);
      }).done(function(notes){
        self.getNotesContent(notes).error(function(e){
          return reject(e);
        }).done(function(notesWithContent){
          resolve(notesWithContent);
        });
      });
    });
  };

  this.getNotesContent = function(notesList){
    var self = this;
    return new Promise(function(resolve, reject){
      var client = self.getClient();
      var noteStore = Promise.promisifyAll(client.getNoteStore());

      Promise.map(notesList, function(note){
        logger.debug('Getting note data for ' + notesList[0].guid);
        return noteStore.getNoteAsync(self._accessToken, note.guid, true, false, false, false);
      }).error(function(e){
        return reject(e);
      }).done(function(notes){
        console.log(notes[0]);
        notes = notes.map(function(note){
          return {
            title: note.title,
            content: enml.PlainTextOfENML(note.content)
          };
        });
        return resolve(notes);
      });
    });
  };

}

var thisClient = new evernoteClient();
module.exports = thisClient;

// vim: sw=2 ts=2 et
