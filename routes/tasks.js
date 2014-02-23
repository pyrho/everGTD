var Promise = require('bluebird');
var logger = require('../libs/logger');
var e = require('evernote');
var NoteFilter = e.Evernote.NoteFilter;
var NotesMetadataResultSpec = e.Evernote.NotesMetadataResultSpec;
var evernoteClient = require('../libs/evernoteClient');
var userModel = require("../libs/userModel");

// /tasks/view/nextActions
exports.viewNextActions = function(req, res){
  console.log(evernoteClient.getClient());
  var noteStore = Promise.promisifyAll(evernoteClient.getClient().getNoteStore());
  var filter = new NoteFilter();
  var rspec = new NotesMetadataResultSpec();
  rspec.includeTitle = true;

  noteStore.findNotesMetadataAsync(req.session.oauthAccessToken, filter, 0, 5, rspec).then(function(notes){
    console.log(notes);
    res.render('index');
  }).error(function(e){
    console.log(" ERROR!: " + e);
  });
  /*
  noteStore.listNotebooks(req.session.oauthAccessToken, function(err, notebooks){

    console.log(JSON.stringify(notebooks));
    res.render('index');
  });
  */
};

module.exports.syncNotebooks = function(req, res){
  var noteStore = Promise.promisifyAll(evernoteClient.getClient().getNoteStore());

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
