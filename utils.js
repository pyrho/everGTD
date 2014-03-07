var mongoose = require('mongoose');
var Promise = require('bluebird');

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

// vim: sw=2 ts=2 et
