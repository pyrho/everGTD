var config = require('../config.json');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('../libs/userModel');
var logger = require('../libs/logger');

// home page
exports.index = function(req, res) {

  userModel.findUser(req.session.userId).then(function(user){
    if(req.session.evernoteAccountBound){
      evernoteClient.initialize(user.accessToken);
    }
  }).error(function(e){
    logger.error('Could not find user:' + e);
  });

  res.render('index');
};

