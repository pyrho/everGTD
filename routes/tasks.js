var config = require('../config.json');
var e = require("evernote");
var Evernote = e.Evernote;
var NoteFilter = e.Evernote.NoteFilter;
var NotesMetadataResultSpec = e.Evernote.NotesMetadataResultSpec;
var Promise = require("bluebird");
var evernoteClient = require("../libs/evernoteClient");

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

// vim: sw=2 ts=2 et