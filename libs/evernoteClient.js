var config = require('../config.json');
var Evernote = require('evernote').Evernote;
var logger = require('./logger');


function evernoteClient(){
  this._client = undefined;
  this._accessToken = undefined;

  // Functions
  this.initialize = function(accessToken){
    if(this._client){
      logger.debug('evernoteClient already initialized');
      return;
    }
    console.trace();
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
    else{
      logger.error('Client is undefined!');
    }
  };
}

var thisClient = new evernoteClient();
module.exports = thisClient;

// vim: sw=2 ts=2 et
