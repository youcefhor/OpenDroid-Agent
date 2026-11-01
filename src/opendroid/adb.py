"""Local Android Debug Bridge adapter."""
import subprocess
from pathlib import Path


class ADBError(RuntimeError):
    """ADB connection or command failure."""


class AndroidDevice:
    def __init__(self, serial=None, timeout=15):
        self.serial = serial
        self.timeout = timeout

    def _base(self):
        return ["adb"] + (["-s", self.serial] if self.serial else [])

    def run(self, *args):
        try:
            result = subprocess.run(
                self._base() + list(args),
                capture_output=True, text=True, timeout=self.timeout,
                check=False,
            )
        except FileNotFoundError as exc:
            raise ADBError("ADB not found. Install Android Platform Tools.") from exc
        except subprocess.TimeoutExpired as exc:
            raise ADBError("ADB timed out.") from exc
        if result.returncode:
            raise ADBError(result.stderr.strip() or "ADB failed")
        return result.stdout

    def devices(self):
        return self.run("devices", "-l")

    def tap(self, x, y):
        self.run("shell", "input", "tap", str(x), str(y))

    def swipe(self, x1, y1, x2, y2, duration=350):
        self.run("shell", "input", "swipe", *map(str, (x1, y1, x2, y2, duration)))

    def hierarchy(self):
        """Dump accessibility-visible nodes; protected screens may omit content."""
        self.run("shell", "uiautomator", "dump", "/sdcard/opendroid-window.xml")
        output = self.run("shell", "cat", "/sdcard/opendroid-window.xml")
        import xml.etree.ElementTree as ET
        try:
            ET.fromstring(output)
        except ET.ParseError as exc:
            raise ADBError("Device returned invalid UI hierarchy XML") from exc
        return output

    def screenshot(self, path):
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            with target.open("wb") as output:
                result = subprocess.run(
                    self._base() + ["exec-out", "screencap", "-p"],
                    stdout=output, stderr=subprocess.PIPE,
                    timeout=self.timeout, check=False,
                )
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            target.unlink(missing_ok=True)
            raise ADBError("Could not capture screenshot.") from exc
        if result.returncode:
            target.unlink(missing_ok=True)
            raise ADBError(result.stderr.decode(errors="replace").strip())
        return target
