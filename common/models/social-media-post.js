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

    instance.text = instance.text || '';
    instance.featurizers = instance.featurizers || [];
    instance.image_urls = instance.image_urls || [];

    if (instance.text.length > 0)
      instance.featurizers.push('text');
    if (instance.image_urls.length > 0)
      instance.featurizers.push('image');

    instance.state = 'new';
    // convert any to epoch
    instance.timestamp_ms = +(new Date(instance.timestamp_ms));

    next();
  }
};
