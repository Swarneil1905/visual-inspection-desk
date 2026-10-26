"""Process lifecycle regressions; CI also stops the real Docker image."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest


class SupervisorTests(unittest.TestCase):
    def launch(self, commands, grace=0.2):
        script = (
            "from supervisor import supervise; "
            f"raise SystemExit(supervise({commands!r}, grace_seconds={grace!r}))"
        )
        process = subprocess.Popen(
            [sys.executable, "-c", script], cwd=Path(__file__).parent,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        self.addCleanup(self.cleanup, process)
        return process

    @staticmethod
    def cleanup(process):
        if process.poll() is None:
            process.kill()
        process.communicate(timeout=5)

    def test_nonzero_child_exit_fails_container(self):
        process = self.launch([[sys.executable, "-c", "raise SystemExit(7)"]])
        stdout, stderr = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 1, stderr)
        self.assertEqual(json.loads(stdout)["exit_code"], 7)

    def test_unexpected_clean_child_exit_also_fails_container(self):
        process = self.launch([[sys.executable, "-c", "pass"]])
        stdout, stderr = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 1, stderr)
        self.assertEqual(json.loads(stdout)["exit_code"], 0)

    def test_missing_executable_fails_container(self):
        process = self.launch([["/missing-required-service"]])
        stdout, stderr = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 1, stderr)
        self.assertIn("Unable to start", stdout)

    @unittest.skipIf(os.name == "nt", "POSIX signals are exercised on Linux CI")
    def test_platform_stop_exits_cleanly_and_reaps_stubborn_child(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "child-ready"
            child = (
                "import os,signal,time; from pathlib import Path; "
                "signal.signal(signal.SIGTERM, signal.SIG_IGN); "
                f"Path({str(marker)!r}).write_text(str(os.getpid())); "
                "time.sleep(30)"
            )
            process = self.launch([[sys.executable, "-c", child]])
            deadline = time.monotonic() + 5
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(0.02)
            self.assertTrue(marker.exists(), "Child never became ready")
            child_pid = int(marker.read_text())
            process.send_signal(signal.SIGTERM)
            stdout, stderr = process.communicate(timeout=5)
            self.assertEqual(process.returncode, 0, stderr)
            self.assertIn("Platform shutdown requested", stdout)
            self.assertIn("exceeded shutdown grace", stdout)
            with self.assertRaises(ProcessLookupError):
                os.kill(child_pid, 0)


if __name__ == "__main__":
    unittest.main()
