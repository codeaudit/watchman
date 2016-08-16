angular.module('com.module.core')
  .controller('ClustersCtrl', ClustersCtrl);

function ClustersCtrl($scope, $window, PostsCluster, SocialMediaPost) {
  $scope.clusters = PostsCluster.find({
    filter: {
      include: 'jobMonitor'
    }
  });

  $scope.showPostDetails = function(evt, postId) {
    var target = evt.target;
    SocialMediaPost.findById({id: postId})
    .$promise
    .then(function(post) {
      var imageUrls = post.image_urls || [];
      var hashtags = post.hashtags || [];
      if (imageUrls.length)
        $window.open(imageUrls[0]);
      else if (hashtags.length)
        $(target).text(hashtags);
      else
        $(target).text(post.text);
    });
  };
}
