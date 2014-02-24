var Promise = require('bluebird');
var logger = require('../libs/logger');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');

// /tasks/view/nextActions
exports.viewNextActions = function(req, res){
  userModel.findUser({_id: req.session.userId}).error(function(e){
    logger.error('Error getting user: ' + e);
  }).done(function(user){
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

module.exports.syncNotebooks = function(req, res){
  var noteStore = Promise.promisifyAll(evernoteClient.getClient(req.session).getNoteStore());

  noteStore.listNotebooksAsync(req.session.oauthAccessToken).error(function(e){
    logger.error('Error in syncNotebooks: ' + e);
    req.flash('error', 'Internal error');
    return res.redirect('/');
  }).done(function(notebooks){
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

// vim: sw=2 ts=2 et
