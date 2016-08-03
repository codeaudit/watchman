'use strict';

const res = require('../../server/util/response-util');

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
    instance.state = 'new';
    // convert any to epoch
    instance.timestamp_ms = +(new Date(instance.timestamp_ms));

    setFeaturizers(instance, next);

    next();
  }
};

function setFeaturizers(instance, done) {
  instance.text = instance.text || '';
  instance.featurizers = instance.featurizers || [];
  instance.image_urls = instance.image_urls || [];

  if (instance.text.length > 0)
    instance.featurizers.push('text');
  if (instance.image_urls.length > 0)
    instance.featurizers.push('image');

  // return custom response if we don't want it.
  // success response, but we're not saving to db.
  if (instance.featurizers.length === 0)
    res.return202(done);
}
