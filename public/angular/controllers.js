var everGTD;
/* jshint ignore:start */
var everGTD = angular.module('everGTD', []);
/* jshint ignore:end */

everGTD.controller('NotesCtrl', function($scope, $http){
  $http.get('/tasks/get/nextActions')
  .success(function(notes){
    $scope.notes = notes;
  })
  .error(function(e){
    console.log('There was an error with get/nextActions:' + e);
  });
});
