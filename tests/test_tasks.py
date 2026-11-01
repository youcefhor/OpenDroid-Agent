import unittest
from unittest.mock import Mock, patch
from opendroid.tasks import validate_task, execute_task, TaskError
from opendroid.adb import AndroidDevice, ADBError


class TaskTests(unittest.TestCase):
    def test_order(self):
        device, sleep = Mock(), Mock()
        steps = [{"action": "tap", "x": 12, "y": 34}, {"action": "wait", "seconds": 1}]
        self.assertEqual(execute_task(device, steps, sleep), 2)
        device.tap.assert_called_once_with(12, 34)
        sleep.assert_called_once_with(1)

    def test_reject_entire_task_before_actions(self):
        device = Mock()
        with self.assertRaises(TaskError):
            execute_task(device, [{"action": "tap", "x": 1, "y": 2}, {"action": "shell"}])
        self.assertEqual(device.mock_calls, [])

    def test_invalid_documents(self):
        for document in [None, [], {}, {"steps": []}, {"steps": [{}]},
                          {"steps": [{"action": []}]},
                          {"steps": [{"action": "wait", "seconds": True}]},
                          {"steps": [{"action": "wait", "seconds": 61}]},
                          {"steps": [{"action": "tap", "x": -1, "y": 0}]},
                          {"steps": [{"action": "wait", "seconds": 0, "extra": 1}]}]:
            with self.subTest(document=document), self.assertRaises(TaskError):
                validate_task(document)

    def test_stop_after_device_error(self):
        device = Mock()
        device.tap.side_effect = ADBError("offline")
        with self.assertRaises(ADBError):
            execute_task(device, [{"action": "tap", "x": 1, "y": 2}] * 2)
        self.assertEqual(device.tap.call_count, 1)

    @patch("opendroid.adb.subprocess.run", side_effect=FileNotFoundError)
    def test_missing_adb(self, run):
        with self.assertRaises(ADBError):
            AndroidDevice().devices()

    @patch("opendroid.adb.AndroidDevice.run")
    def test_hierarchy(self, run):
        run.side_effect = ["dumped", '<hierarchy><node text="Settings"/></hierarchy>']
        self.assertIn('Settings', AndroidDevice().hierarchy())

    @patch("opendroid.adb.AndroidDevice.run")
    def test_invalid_hierarchy(self, run):
        run.side_effect = ["dumped", 'error']
        with self.assertRaises(ADBError):
            AndroidDevice().hierarchy()
