'use strict';

module.exports = function(SocialMediaPost) {
  // allow Create, ChangeStream only
  SocialMediaPost.disableRemoteMethod('upsert', true);
  SocialMediaPost.disableRemoteMethod('deleteById', true);
  SocialMediaPost.disableRemoteMethod('updateAll', true);
  SocialMediaPost.disableRemoteMethod('updateAttributes', false);

  SocialMediaPost.observe('before save', decorate);

  function decorate(context, next) {
    if (!context.isNewInstance) {
      return next();
    }

    const instance = context.instance;

    // TODO: update other attrs
    instance.featurizers = ['image'];
    instance.state = 'new';

    next();
  }
};
