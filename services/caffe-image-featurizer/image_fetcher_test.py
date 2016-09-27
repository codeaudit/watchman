import unittest
import image_fetcher as fetcher

class ImageFetcherTest(unittest.TestCase):

    # mock download file path
    fetcher.create_file_name = lambda path: '/tmp/mockfilename'

    def test_fetch_image_succeeds(self):
        file_path = fetcher.fetch_image('https://www.instagram.com/p/BJsmWmLDiD3/', '/tmp/')
        self.assertEqual(file_path, {
            'image_url': 'https://scontent.cdninstagram.com/l/t51.2885-15/e35/14026599_1761633914048354_889821364_n.jpg?ig_cache_key=MTMyNzYwNDY2ODc1MTAyODQ3MQ%3D%3D.2',
            'image_path': '/tmp/mockfilename'
        })

    def test_fetch_image_404_response(self):
        file_path = fetcher.fetch_image('https://www.instagram.com/p/bogus/', '/tmp/')
        self.assertIsNone(file_path)

    def test_fetch_image_invalid_domain(self):
        file_path = fetcher.fetch_image('https://www.bogus.com', '/tmp/')
        self.assertIsNone(file_path)

if __name__ == '__main__':
    unittest.main()
