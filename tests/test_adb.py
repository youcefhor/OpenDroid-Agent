import unittest
from unittest.mock import patch, Mock
from opendroid.adb import AndroidDevice, ADBError


class TestADB(unittest.TestCase):
    @patch("opendroid.adb.subprocess.run")
    def test_tap(self, run):
        run.return_value = Mock(returncode=0, stdout="", stderr="")
        AndroidDevice(serial="phone").tap(12, 34)
        self.assertEqual(
            run.call_args.args[0],
            ["adb", "-s", "phone", "shell", "input", "tap", "12", "34"]
        )

    @patch("opendroid.adb.subprocess.run")
    def test_error(self, run):
        run.return_value = Mock(returncode=1, stdout="", stderr="device offline")
        with self.assertRaisesRegex(ADBError, "device offline"):
            AndroidDevice().devices()


if __name__ == "__main__":
    unittest.main()
