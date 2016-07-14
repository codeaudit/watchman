#ENV vars that should be set and what they default to if they are not
#CAFFE_HOME = '/home/caffe_user/caffe/'
#CAFFE_MODEL_PATH = '/home/caffe-user/caffe/models/bvlc_reference_caffenet/'
#CAFFE_MODEL = bvlc_reference_caffenet.caffemodel
#CAFFE_PYTHON_PATH = /home/caffe-user/caffe/python/

import redis
import threading
import caffe_feature_extraction
import time
import os


class Worker(threading.Thread):
    def __init__(self, redis_send, message):
        threading.Thread.__init__(self)
        self.send = redis_send
        self.item = message
        self.caffe_root = os.getenv('CAFFE_HOME', '/home/caffe-user/caffe/')

    def run(self):
        # import pdb; pdb.set_trace()
        key = self.item['data']
        if key == 1:  # subscribe response
            print 'SUBSCRIBED BEHAVIOR'
            return
        # get object for corresponding item:
        obj = self.send.hgetall(key)
        if not obj:
            self.send.hmset(key, {'state': 'error', 'error': 'could not find item in redis'})
            print 'COULD NOT FIND ITEM IN REDIS'
            return
        print obj
        print type(obj)
        obj_dict = obj
        if obj_dict['state'] != 'downloaded':  # not yet ready
            print 'NOT YET DOWNLOADED'
            return
        path = obj_dict['path']
        start_time = time.time()
        image_dir_path = path
        # try:
        obj_dict['state'] = 'processing'
        self.send.hmset(key, obj_dict)

        # get features:
        print 'GETTING FEATURES'
        features = caffe_feature_extraction.get_all_features_in_path(self.caffe_root, image_dir_path, start_time)
        if not features:
            print 'INVALID IMAGE OR DIRECTORY PATH'
            self.send.hmset(key, {'state': 'error', 'error': 'invalid image or directory path'})
            return
        print 'FINISHED FEATURE PROCESSING'
        obj_dict['data'] = features
        obj_dict['state'] = 'processed'
        # report features to redis
        self.send.hmset(key, obj_dict)


class Listener(threading.Thread):
    def __init__(self, redis_receive, redis_send, channels):
        threading.Thread.__init__(self)
        self.redis_receive = redis_receive
        self.redis_send = redis_send
        self.pubsub_receive = self.redis_receive.pubsub()
        self.pubsub_receive.subscribe(channels)

    def run(self):
        # listen for messages and do work:
        for item in self.pubsub_receive.listen():
            print 'MESSAGE HEARD'
            if item['data'] == "KILL":
                self.pubsub_receive.unsubscribe()
                print self, "un-subscribed and finished"
                break
            else:
                worker = Worker(self.redis_send, item)
                worker.start()


if __name__ == "__main__":
    pool = redis.ConnectionPool(host='redis', port=6379)
    r1 = redis.Redis(connection_pool=pool)
    r2 = redis.Redis(connection_pool=pool)
    client = Listener(r1, r2, ['features'])
    client.start()
