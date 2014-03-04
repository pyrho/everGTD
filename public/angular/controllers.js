var everGTD;
/* jshint ignore:start */
var everGTD = angular.module('everGTD', []);
/* jshint ignore:end */

everGTD.controller('NotesCtrl', function($scope, $http){
  $http.get('/tasks/get/nextActions')
  .success(function(notes){
    $scope.notes = notes.map(function(note){
      return {
        title: note.title,
        tagString: (function(){
          var tags = note.tags;
          var tagString = '';
          for(var i = 0; i < tags.length; ++i){
            tagString += tags[i];
            if(i < (tags.length - 1)){
              tagString += '|';
            }
          }
          return tagString;
        }()),
        content: note.content
      };
    });
  })
  .error(function(e){
    console.log('There was an error with get/nextActions:' + e);
  });
});

// vim: sw=2 ts=2 et
