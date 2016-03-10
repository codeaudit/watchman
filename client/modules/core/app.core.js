angular.module('com.module.core',['leaflet-directive'])

// silence angular leaflet console messages
// does it affect other modules?
.config(function($logProvider){
  $logProvider.debugEnabled(false);
});;
