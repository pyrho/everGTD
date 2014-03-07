var mongoose = require('mongoose');
var Promise = require('bluebird');
var crypto = require('crypto');

function getFunctionName(fun) {
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

module.exports.registerModuleFunctions = function(thisModule, functions){
  functions.forEach(function(fn){
    thisModule[getFunctionName(fn)] = fn;
  });
};

module.exports.db = mongoose.createConnection('mongodb://localhost/everGTD');

module.exports.cache = function(){
  var cache = {};
  return {
    set: function(key, val){
      cache[key] = val;
    },
    get: function(key){
      return cache[key];
    }
  };
};

module.exports.getHashSaltAndKeyFromPassword = function(password){
  if(!password || password.length <= 0){
    return Promise.reject(new Error('Password was undefnied'));
  }
  return new Promise(function(resolve, reject){
    var salt = crypto.randomBytes(128).toString('base64');
    crypto.pbkdf2(password, salt, 25000, 256, function(err, derivedKeyBytes){
      if(err){
        reject(new Error(''+err));
      }

      var derivedKey = derivedKeyBytes.toString('base64');
      var middle = derivedKey.length / 2;
      console.log('MID: ' + derivedKey.length);
      // Used to cipher the user's password
      var hashedPassword = derivedKey.substr(0, middle);
      // Used to cipher the user's access token
      var symetricKey = derivedKey.substr(middle);

      resolve([salt, hashedPassword, symetricKey]);
    });
  });
};

module.exports.cipherData = function(key, plainData){
  var cipher = crypto.createCipher('aes-256-cbc', key);
  var enc = cipher.update(plainData, 'utf-8', 'base64');
  enc = enc + cipher.final('base64');
  return enc;
};

module.exports.decipherData = function(key, encryptedData){
  var decipher = crypto.createDecipher('aes-256-cbc', key);
  var plain = decipher.update(encryptedData, 'base64', 'utf-8');
  plain = plain + decipher.final('utf-8');
  return plain;
};

var c = module.exports.cipherData('l', 'mdr');
var d = module.exports.decipherData('l', c);
console.log(c);
console.log(d);

// vim: sw=2 ts=2 et
