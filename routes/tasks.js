var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');
var notesCollection = require('../libs/notesCollection');

Promise.longStackTraces();

exports = {};

// /tasks/moveUp
exports.moveUp = function(req, res){
  notesCollection.moveNoteUp(req.session.userId, req.params.noteGuid)
  .then(function(){
    return res.redirect('/tasks/view/nextActions');
  })
  .error(function(e){
    return res.render('error', {
      errorMessage: e.message
    });
  });
};

// /tasks/moveDown
exports.moveDown = function(req, res){
  notesCollection.moveNoteDown(req.session.userId, req.params.noteGuid)
  .then(function(){
    return res.redirect('/tasks/view/nextActions');
  })
  .error(function(e){
    return res.render('error', {
      errorMessage: e.message
    });
  });
};

exports.getNextActions = function(req, res){
  userModel.findUser({_id: req.session.userId})
    .done(function(user){
      user.getNotes()
        .then(function(notes){
        })
        .error(function(e){
          return res.json({
            'error': e
          });
        });
      evernoteClient.getNotesList(req.session, user.notebooks.nextActions)
        .then(function(notes){
          return res.json(notes);
        })
        .error(function(e){
          return res.send('ko' + e);
        });
    });
};

// /tasks/view/nextActions
exports.viewNextActions = function(req, res){
  return res.render('tasks/next_actions_angular');
};

// /tasks/syncNotebooks
function syncNotebooks(req, res){
  var noteStore = Promise.promisifyAll(evernoteClient.getClient(req.session).getNoteStore());
  logger.debug('Syncing notebooks');
  noteStore.listNotebooksAsync(req.session.oauthAccessToken)
    .then(function(notebooks){
      logger.debug('Got list of notebooks');
      var nextActionsGuid = null;
      var inboxGuid = null;
      var i;
      for(i = 0; i < notebooks.length; ++i){
        if(nextActionsGuid && inboxGuid){
          break;
        }

        var notebook = notebooks[i];
        if(notebook.name === '__next_actions'){
          nextActionsGuid = notebook.guid;
          continue;
        }
        if(notebook.name === '__inbox'){
          inboxGuid = notebook.guid;
          continue;
        }
      }

      if(!nextActionsGuid || !inboxGuid){
        req.flash('error', 'Required notebooks not found..');
        return res.redirect('/');
      }

      logger.debug('Found all notebooks: ' + nextActionsGuid + ', ' + inboxGuid);

      userModel.updateNotebookGuids(req.session.userId, nextActionsGuid, inboxGuid)
        .then(function(){
          req.flash('success', 'Notebook guids synchronized');
          return res.redirect('/');
        })
        .error(function(e){
          req.flash('error', 'Internal error');
          logger.error('Error in syncNotebooks: ' + e);
          return res.redirect('/');
        });
    })
    .error(function(e){
      logger.error('Error in syncNotebooks: ' + e);
      req.flash('error', 'Internal error');
      return res.redirect('/');
    });
};
module.exports.syncNotebooks = syncNotebooks;

exports.deleteCache = function deleteCache(req, res){
  notesCollection.deleteUserNotes(req.session.userId)
  .error(function(e){
    logger.error('Couldnt delete cache' + e);
    req.flash('error', 'Internal error');
    res.redirect('/');
  })
  .done(function(){
    req.flash('success', 'Cache deleted');
    res.redirect('/');
  });
};

// vim: sw=2 ts=2 et
