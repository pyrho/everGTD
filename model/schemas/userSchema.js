var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird');
Promise.longStackTraces();
var NoteSchema = require('./noteSchema');
var utils = require('../../utils');


var userSchema = new Schema({
  username: {type: String, unique: true},
  email: String,
  password: String, // hashed
  cipheredAccessToken: String, // hashed
  salt: String,
  evernoteUserId: Number,
  notes: [NoteSchema]
});

////////////////////////////////////////////////////////////////////////////////
//// Virtuals {{{
userSchema.virtual('acessToken').get(function(){
});
// }}}


////////////////////////////////////////////////////////////////////////////////
//// Statics {{{
userSchema.statics.getUserById = function(id){
  var self = this;
  return new Promise(function(resolve, reject){
    self.findOne({_id: id}, function(e, r){
      resolve(r);
    });
  });
};

userSchema.statics.findByUsername = function(username){
  if(!username){
    return Promise.reject(new Error('Invalid parameters'));
  }
  var self = this;
  return new Promise(function(resolve, reject){
    self.findOne({username: username}, function(e, r){
      if(e){
        return reject(new Error(''+e));
      }
      return resolve(r);
    });
  });
};

userSchema.statics.checkAuthentication = function(username, password){
  if(!username || !password){
    return Promise.reject(new Error('Invalid parameters'));
  }
  var self = this;
  return new Promise(function(resolve, reject){
    utils.getHashSaltAndKeyFromPassword(password).spread(function(passwordHashed, userSymetricKey){
      utils.cache.set('symetricKey', userSymetricKey);
      self.findOne({
        username: username,
        password: passwordHashed
      }, function(e, user){
        if(e){
          return reject(new Error(''+e));
        }
        return resolve(user);
      });
    });
  });
};

// }}}

////////////////////////////////////////////////////////////////////////////////
//// Methods {{{
userSchema.methods.bindEvernoteAccount = function(accessToken, evernoteUserId){
  if(!accessToken || !evernoteUserId){
    return Promise.reject(new Error('Invalid parameters'));
  }
  var self = this;
  return new Promise(function(resolve, reject){
    var key = utils.cache.get('symetricKey');
    self.evernoteUserId = evernoteUserId;
    self.cipheredAccessToken = utils.cipherData(key, accessToken);
    self.save(function(e){
      if(e){
        return reject(new Error(''+e));
      }
      return resolve();
    });
  });
};

userSchema.methods.setDataOnAccountCreation = function(username, email, password){
  if(!username || !email || !password){
    return Promise.reject(new Error('Invalid parameters'));
  }
  var self = this;

  return new Promise(function(resolve, reject){
    self.username = username;
    self.email = email;
    utils.getHashSaltAndKeyFromPassword(password).spread(function(passwordHashed){
      self.password = passwordHashed;
      self.save(function(e){
        if(e){
          return reject(new Error(''+e));
        }
        return resolve();
      });
    });
  });
};
// }}}

module.exports = userSchema;

// vim: sw=2 ts=2 et

