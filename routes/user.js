var config = require('../config.json');
var e = require("evernote");
var Evernote = e.Evernote;
var Promise = require("bluebird");


exports.syncNotebooks = function(req, res){
  var token = req.session.oauthAccessToken;
  var client = new Evernote.Client({
    token: token,
    sandbox: config.SANDBOX
  });

  var noteStore = Promise.promisifyAll(client.getNoteStore());
  
};

// vim: sw=2 ts=2 et
