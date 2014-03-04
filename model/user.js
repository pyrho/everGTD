var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/everGTD');
var logger = require('../libs/logger');
var Schema = mongoose.Schema;

var noteSchema = new Schema({
  tags: Array,
  content: String,
  title: String
});

var userSchema = new Schema({
  email: String,
  accessToken: String,
  evernoteAccountBindingDone: Boolean,
  evernoteUserId: Number,
  notes: [noteSchema]
});

var User = mongoose.model('User', userSchema);
db.on('error', logger.error.bind(console, 'connection error:'));
db.once('open', function cb(){


});
 
// vim: sw=2 ts=2 et

