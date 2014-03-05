var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird');
Promise.longStackTraces();
var crypto = require('crypto');
var NoteSchema = require('./noteSchema');


var userSchema = new Schema({
  username: {type: String, unique: true},
  email: String,
  password: String,
  accessToken: String,
  evernoteUserId: Number,
  notes: [NoteSchema]
});


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
    var hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    self.findOne({
      username: username,
      password: hashedPassword
    }, function(e, user){
      if(e){
        return reject(new Error(''+e));
      }
      return resolve(user);
    });
  });
};

// }}}

////////////////////////////////////////////////////////////////////////////////
//// Methods {{{
userSchema.methods.test = function(){
  console.log("TESTED");
  return Promise.resolve();
};
userSchema.methods.bindEvernoteAccount = function(accessToken, evernoteUserId){
  if(!accessToken || !evernoteUserId){
    return Promise.reject(new Error('Invalid parameters'));
  }
  var self = this;
  return new Promise(function(resolve, reject){
    self.evernoteUserId = evernoteUserId;
    self.accessToken = accessToken;
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
    var hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    self.username = username;
    self.email = email;
    self.password = hashedPassword;
    self.save(function(e){
      if(e){
        return reject(new Error(''+e));
      }
      return resolve();
    });
  });
};
// }}}

module.exports = userSchema;

// vim: sw=2 ts=2 et

