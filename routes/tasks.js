var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');
var notesCollection = require('../libs/notesCollection');

Promise.longStackTraces();

// /tasks/moveUp
module.exports.moveUp = function(req, res){
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
module.exports.moveDown = function(req, res){
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

module.exports.viewNextActions2 = function(req, res){
  return res.render('tasks/next_actions2');
};

// /tasks/view/nextActions
module.exports.viewNextActions = function viewNextActions(req, res){
  userModel.findUser({_id: req.session.userId}).error(function(e){
    logger.error('Error getting user: ' + e);
  }).done(function(user){
    if(!user.notebooks || !user.notebooks.nextActions){
      return res.redirect('/tasks/syncNotebooks');
    }
    var nextActionsGuid = user.notebooks.nextActions;
    evernoteClient.getNotesList(req.session, nextActionsGuid).error(function(e){
      logger.error('Error getNotesList user: ' + e);
    }).then(function(notes){
      return res.render('tasks/next_actions', {
        notes: notes
      });
    });
  });
};

module.exports.getNextActions = function(req, res){
  return userModel.findUser({_id: req.session.userId})
  .done(function(user){
    evernoteClient.getNotesList(req.session, user.notebooks.nextActions)
    .done(function(notes){
      return res.json(notes);
    });
  });
};

// /tasks/syncNotebooks
module.exports.syncNotebooks = function(req, res){
  var noteStore = Promise.promisifyAll(evernoteClient.getClient(req.session).getNoteStore());
  logger.debug('Syncing notebooks');
  noteStore.listNotebooksAsync(req.session.oauthAccessToken).error(function(e){
    logger.error('Error in syncNotebooks: ' + e);
    req.flash('error', 'Internal error');
    return res.redirect('/');
  }).done(function(notebooks){
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

    userModel.updateNotebooks(req.session.userId, nextActionsGuid, inboxGuid).error(function(e){
      req.flash('error', 'Internal error');
      logger.error('Error in syncNotebooks: ' + e);
      return res.redirect('/');
    }).done(function(){
      req.flash('success', 'Notebooks synchronized');
      return res.redirect('/');
    });

  });
};

module.exports.deleteCache = function(req, res){
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
