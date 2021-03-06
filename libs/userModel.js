var Promise = require('bluebird');
var config = require('../config.json');
var db = require('monk')(config.mongo.host + '/everGTD');
var logger = require('./logger');
var evernoteClient = require('../libs/evernoteClient');
var crypto = require('crypto');

// Returns null if user is not found
module.exports.findUser = function(findParams){
  return new Promise(function(resolve, reject){
    var usersCollection = db.get('users');
    usersCollection.findOne(findParams)
      .success(function(user){
        return resolve(user);
      }).on('error', reject);
  });
};

module.exports.authenticateUser = function(username, password){
  return new Promise(function(resolve, reject){
    var hashedPw = crypto.createHash('md5').update(password).digest('hex');
    var usersCollection = db.get('users');
    usersCollection.findOne({
      username: username,
      password: hashedPw
    }).success(function(user){
      return resolve(user);
    }).on('error', reject);
  });
};

module.exports.createUser = function(username, password, email){
  return new Promise(function(resolve, reject){
    var findUserPromise = module.exports.findUser({username: username});

    findUserPromise.error(function(e){
      return reject(new Error('Error in createUser: ' + e));
    });

    findUserPromise.done(function(user){
      if(user){
        logger.info('User already exists');
        return resolve({found:true});
      }

      // User doesn't exists, create it
      logger.info('User doesnt exist! Creating');
      var usersCollection = db.get('users');
      var hashedPw = crypto.createHash('md5').update(password).digest('hex');
      usersCollection.insert({
        username: username,
        password: hashedPw,
        email: email,
        evernoteAccountBound: false
      }).success(function(user){
        logger.info('User creating successful: ' + JSON.stringify(user));
        return resolve({found:false, user: user});
      }).on('error', reject);
    });

  });
};



module.exports.updateUserAccessToken = function(evernoteUserId, newAccessToken){
  return new Promise(function(resolve, reject){
    var usersCollection = db.get('users');
    usersCollection.find({
      evernoteUserId: evernoteUserId
    }).success(function(user){
      if(!user){
        reject(new Error('The user was not found'));
      }
      usersCollection.update({
        evernoteUserId: evernoteUserId,
      },{
        accessToken: newAccessToken
      }).success(function(){
        resolve();
      }).on('error', reject);
    }).on('error', reject);
  });
};

module.exports.bindEvernoteAccount = function(userId, accessToken, evernoteUserId){
  return new Promise(function(resolve, reject){
    var findP = module.exports.findUser({_id: userId});

    findP.error(reject);

    findP.done(function(user){
      if(!user){
        logger.crit('User not found when binding to evernote account, SHOULD NOT HAPPEN!');
        return reject(new Error('User not found'));
      }

      module.exports.updateUserData({_id: userId}, {
        '$set': {
          'evernoteUserId': evernoteUserId,
          'accessToken': accessToken,
          'evernoteAccountBound': true
        },
      }).then(function(){
        evernoteClient.initialize(accessToken);
        return resolve();
      }).error(reject);
    });
  });
};

module.exports.updateUserData = function(findParams, updatedParams){
  return new Promise(function(resolve, reject){
    logger.debug('Updating user data for: ' + JSON.stringify(findParams));
    var usersCollection = db.get('users');
    usersCollection.update(findParams, updatedParams).success(function(){
      logger.debug('Resolving, Updated user date with: ' + JSON.stringify(updatedParams));
      return resolve();
    }).on('error', reject);
  });
};

module.exports.updateNotebooks = function(userId, naGuid, inbGuid){
  logger.debug('Updating user notebooks');
  return module.exports.updateUserData({_id: userId}, {
    '$set': {
      'notebooks': {
        'nextActions': naGuid,
        'inbox': inbGuid
      }
    }
  });
};

// vim: sw=2 ts=2 et
