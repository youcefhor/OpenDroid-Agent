import json
import threading
import unittest
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer
from unittest.mock import Mock, patch
from opendroid.server import Bridge, make_handler, plan_device, validate_model_steps


class ServerTests(unittest.TestCase):
    def test_allowlist(self):
        self.assertEqual(plan_device('افتح الإعدادات')['action'], 'settings')
        self.assertEqual(plan_device('انقر 100 200')['x'], 100)
        for value in ('shell rm -rf /', 'tap 10001 1', '', None, 'send money'):
            with self.assertRaises(ValueError):
                plan_device(value)

    def test_model_schema(self):
        self.assertEqual(validate_model_steps([{'action': 'wifi', 'value': True}])[0]['value'], True)
        for value in ([{'action': 'shell'}], [{'action': 'send', 'value': 'x'}],
                      [{'action': 'open', 'value': 'bank'}], [{'action': 'note', 'value': ''}]):
            with self.assertRaises(ValueError):
                validate_model_steps(value)

    @patch('opendroid.server.AndroidDevice')
    def test_selection_rejects_unauthorized_and_multiple(self, device):
        device.return_value.devices.return_value = 'List of devices attached\na unauthorized\n'
        with self.assertRaises(Exception):
            Bridge().device()
        device.return_value.devices.return_value = 'List of devices attached\na device\nb device\n'
        with self.assertRaises(Exception):
            Bridge().device()

    def test_approval_required_one_use_and_bound_to_device(self):
        bridge = Bridge()
        with self.assertRaises(ValueError):
            bridge.execute('unknown')
        device = Mock(serial='a')
        bridge.device = Mock(return_value=device)
        result = bridge.prepare('الرئيسية')
        device.serial = 'b'
        with self.assertRaisesRegex(ValueError, 'تغير'):
            bridge.execute(result['approval_id'])
        with self.assertRaises(ValueError):
            bridge.execute(result['approval_id'])
        device.run.assert_not_called()

    def test_http_auth_origin_and_static(self):
        bridge = Bridge(token='test-token')
        server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(bridge))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}'
        try:
            with urllib.request.urlopen(base) as response:
                self.assertIn('OpenDroid', response.read().decode())
            for headers, status in [({}, 401), ({'X-OpenDroid-Token': 'test-token', 'Origin': 'https://evil.test'}, 403)]:
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(urllib.request.Request(base + '/api/device', headers=headers))
                self.assertEqual(error.exception.code, status)
            request = urllib.request.Request(base + '/api/device/execute', data=json.dumps({'approval_id': 'no'}).encode(), headers={'X-OpenDroid-Token': 'test-token'})
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(request)
            self.assertEqual(error.exception.code, 400)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
