import unittest
import redis_dispatcher as rd
import mock

class RedisDispatcherTest(unittest.TestCase):

    def setUp(self):
        self.redis = mock.Mock()

    def test_redis_mocks(self):
        self.redis.hgetall.return_value = {'a': 1}
        self.redis.hmset.return_value = 1

        worker = rd.Worker(self.redis)

        self.assertEqual(worker.send.hgetall(), {'a': 1})
        self.assertEqual(worker.send.hmset(), 1)

    def test_run_with_missing_job(self):
        self.redis.hgetall.return_value = None

        worker = rd.Worker(self.redis)

        pub_msg = dict(data=1)

        self.assertEqual(worker.run(pub_msg), 0)

if __name__ == '__main__':
    unittest.main()
