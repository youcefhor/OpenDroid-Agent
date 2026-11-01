"""Validated, bounded task execution without arbitrary shell commands."""
import json
import time
from pathlib import Path


class TaskError(ValueError):
    """Invalid task document."""


FIELDS = {
    "tap": ("x", "y"),
    "swipe": ("x1", "y1", "x2", "y2", "duration"),
    "wait": ("seconds",),
}


def validate_task(document):
    if not isinstance(document, dict) or set(document) != {"steps"}:
        raise TaskError("Task must contain only a steps array")
    steps = document["steps"]
    if not isinstance(steps, list) or not 1 <= len(steps) <= 100:
        raise TaskError("Task must have 1..100 steps")
    validated = []
    for index, step in enumerate(steps, 1):
        if not isinstance(step, dict):
            raise TaskError(f"Step {index} must be an object")
        action = step.get("action")
        if not isinstance(action, str) or action not in FIELDS:
            raise TaskError(f"Step {index}: unknown action")
        fields = FIELDS[action]
        if set(step) != {"action", *fields}:
            raise TaskError(f"Step {index}: expected {', '.join(fields)}")
        for field in fields:
            value = step[field]
            maximum = 60 if field == "seconds" else 10000
            if type(value) is not int or not 0 <= value <= maximum:
                raise TaskError(f"Step {index}: {field} must be an integer 0..{maximum}")
        validated.append(dict(step))
    return validated


def load_task(path):
    return validate_task(json.loads(Path(path).read_text(encoding="utf-8")))


def execute_task(device, steps, sleep=time.sleep):
    # Revalidate here too, so direct callers cannot skip validation.
    steps = validate_task({"steps": steps})
    for step in steps:
        action = step["action"]
        if action == "wait":
            sleep(step["seconds"])
        else:
            getattr(device, action)(*(step[field] for field in FIELDS[action]))
    return len(steps)
