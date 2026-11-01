"""Command line interface: explicit confirmation before device actions."""
import argparse
from .adb import AndroidDevice, ADBError
from .tasks import load_task, execute_task, TaskError


def main():
    parser = argparse.ArgumentParser(description="OpenDroid Agent")
    parser.add_argument("--serial", help="ADB serial if multiple devices are connected")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("devices", help="List attached Android devices")
    screenshot = commands.add_parser("screenshot", help="Save screen to a PNG file")
    screenshot.add_argument("path", nargs="?", default="screenshot.png")
    tap = commands.add_parser("tap", help="Tap at screen coordinates")
    tap.add_argument("x", type=int)
    tap.add_argument("y", type=int)
    swipe = commands.add_parser("swipe", help="Swipe between screen coordinates")
    for coordinate in ("x1", "y1", "x2", "y2"):
        swipe.add_argument(coordinate, type=int)
    swipe.add_argument("--duration", type=int, default=350)
    hierarchy = commands.add_parser("hierarchy", help="Print the UI hierarchy XML")
    task = commands.add_parser("run", help="Validate and execute a JSON task")
    task.add_argument("path")
    task.add_argument("--dry-run", action="store_true", help="Validate without contacting the phone")
    task.add_argument("--yes", action="store_true", help="Approve the complete validated task")
    args = parser.parse_args()
    device = AndroidDevice(serial=args.serial)
    try:
        if args.command == "run":
            steps = load_task(args.path)
            print(f"Validated {len(steps)} steps:")
            for index, step in enumerate(steps, 1):
                print(index, step)
            if args.dry_run:
                return
            if not args.yes and input("Execute this complete task? [y/N] ").strip().lower() != "y":
                print("Cancelled")
                return
            print(f"Completed {execute_task(device, steps)} steps")
        elif args.command == "hierarchy":
            print(device.hierarchy())
        elif args.command == "devices":
            print(device.devices())
        elif args.command == "screenshot":
            print("Saved:", device.screenshot(args.path))
        else:
            if input("Send this action to the phone? [y/N] ").strip().lower() != "y":
                print("Cancelled")
                return
            if args.command == "tap":
                device.tap(args.x, args.y)
            else:
                if not 0 <= args.duration <= 10000:
                    parser.error("Duration must be 0..10000 milliseconds")
                device.swipe(args.x1, args.y1, args.x2, args.y2, args.duration)
            print("Action sent")
    except (ADBError, TaskError, OSError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
