var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var noteSchema = new Schema({
  tags: Array,
  content: String,
  title: String
});

module.exports = noteSchema;
