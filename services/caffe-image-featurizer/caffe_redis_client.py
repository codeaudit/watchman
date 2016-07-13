import redis
import threading
import caffe_feature_extraction
import json
import time

class Listener(threading.Thread):
   def __init__(self, r1, r2, channels):
       threading.Thread.__init__(self)
       self.redis_1 = r1
       self.redis_2 = r2
       self.pubsub_receive = self.redis_1.pubsub()
       self.pubsub_receive.subscribe(channels)
       self.caffe_root = '/home/caffe-user/caffe/'

   def work(self, item):
       #import pdb; pdb.set_trace()
       key = item['data']
       if key == 1: # subscribe response
           print 'SUBSCRIBED BEHAVIOR'
           return
       # get object for corresponding item:
       obj = self.redis_2.hgetall(key)
       if not obj:
           self.redis_2.hmset(key, {'state': 'error', 'error': 'could not find item in redis'})
           print 'COULD NOT FIND ITEM IN REDIS'
           return
       print obj
       print type(obj)
       # obj_dict = json.loads(obj)
       obj_dict = obj
       if obj_dict['state'] != 'downloaded': # not yet ready
           print 'NOT YET DOWNLOADED'
           return
       state = obj_dict['state']
       path = obj_dict['path']
       start_time = time.time()
       output_path = 'temp'
       image_dir_path = path
       # try:
       obj_dict['state'] = 'processing'
       self.redis_2.hmset(key, obj_dict)

       # get features:
       print 'GETTING FEATURES'
       features = caffe_feature_extraction.get_all_features_in_path(self.caffe_root, image_dir_path, start_time)
       if features == None:
           print 'INVALID IMAGE OR DIRECTORY PATH'
           self.redis_2.hmset(key, {'state': 'error', 'error': 'invalid image or directory path'})
           return
       print 'FINISHED FEATURE PROCESSING'
       obj_dict['data'] = features
       obj_dict['state'] = 'processed'
       # report features to redis
       self.redis_2.hmset(key, obj_dict)
       # except Exception as e:
       #     print 'ERROR IN FEATURE EXTRACTION'
       #     obj_dict['state'] = 'error'
       #     obj_dict['error'] = e
       #     # report features to redis
       #     self.redis_2.hmset(key, obj_dict)

       # print item['channel'], ":", item['data']

   def run(self):
       # listen for messages and do work:
       for item in self.pubsub_receive.listen():
           print 'MESSAGE HEARD'
           if item['data'] == "KILL":
               self.pubsub_receive.unsubscribe()
               # self.pubsub_report.unsubscribe()
               print self, "unsubscribed and finished"
               break
           else:
           # self.pubsub_report.run_in_thread(self.work(item))
            self.work(item)

if __name__ == "__main__":
   pool = redis.ConnectionPool(host='redis', port=6379)
   r1 = redis.Redis(connection_pool=pool)
   r2 = redis.Redis(connection_pool=pool)
   client = Listener(r1, r2, ['features'])
   client.start()
