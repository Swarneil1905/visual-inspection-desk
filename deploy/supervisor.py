"""Supervise the web stack and distinguish platform shutdowns from failures."""
import json
import signal
import subprocess
import time


def supervise(commands, grace_seconds=8):
    processes = []
    stopping = False
    previous_handlers = {}

    def request_stop(signum, _frame):
        nonlocal stopping
        stopping = True

    def log(level, message, **fields):
        print(json.dumps(dict(level=level, message=message, **fields)), flush=True)

    try:
        for signum in (signal.SIGTERM, signal.SIGINT):
            previous_handlers[signum] = signal.signal(signum, request_stop)
        for command in commands:
            if stopping:
                break
            processes.append(subprocess.Popen(command))
        while not stopping:
            for process in processes:
                code = process.poll()
                if code is not None:
                    log("error", "Required process exited unexpectedly",
                        process=process.args[0], exit_code=code)
                    return 1
            time.sleep(0.1)
        log("info", "Platform shutdown requested")
        return 0
    except OSError as error:
        log("error", "Unable to start a required process", error=str(error))
        return 1
    finally:
        # Cleanup must not turn an unexpected child exit into a successful stop.
        for process in processes:
            if process.poll() is None:
                try:
                    process.terminate()
                except ProcessLookupError:
                    pass
        deadline = time.monotonic() + grace_seconds
        for process in processes:
            try:
                process.wait(timeout=max(0.01, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                log("warning", "Process exceeded shutdown grace period",
                    process=process.args[0])
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
                process.wait()
        for signum, handler in previous_handlers.items():
            signal.signal(signum, handler)
