angular.module('com.module.core')
  .controller('JobMonitorsCtrl', JobMonitorsCtrl);

function JobMonitorsCtrl($scope, $window, JobMonitor) {
  $scope.jobMonitors = JobMonitor.find({
    filter: {
      limit: 200,
      order: 'created desc'
    }
  });
}
