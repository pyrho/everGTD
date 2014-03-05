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

function test(a, b){
  module.exports.checkArgs(arguments, 3)
  .error(function(e){
    console.log('MAILOL');
  });

  console.log(a + b);
}

// vim: sw=2 ts=2 et
