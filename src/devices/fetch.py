from dataclasses import dataclass
import subprocess
import re
import pprint


@dataclass
class Device:
    name: str
    device_files: list[str]


@dataclass
class Quality:
    size: str
    fps: list[float]


@dataclass
class Format:
    format: str
    quality: list[Quality]


def v4l2_ctl_format_ext(device) -> list[Format] | None:
    try:
        output = subprocess.check_output(
            [
                "v4l2-ctl",
                "-d",
                device,
                "--list-formats-ext",
            ]
        ).decode("utf-8")
    except subprocess.CalledProcessError as e:
        print("Error: %s" % e.output)
        return None

    lines = output.split("\n")
    formats: list[Format] = []
    for line in lines:
        format_match = re.findall(r"\[\d+\]: (.*)", line)
        size_match = re.findall(r"^\s*Size: Discrete (\d+x\d+)", line)
        fps_match = re.findall(
            r"^\s*Interval: Discrete \d+\.\d+s \((\d+.\d+) fps\)", line
        )
        if len(format_match) > 0:
            formats.append(Format(format_match[0], []))
        if len(size_match) > 0:
            formats[-1].quality.append(Quality(size_match[0], []))
        if len(fps_match) > 0:
            formats[-1].quality[-1].fps.append(float(fps_match[0]))
    return formats


def v4l2_ctl_list_devices() -> list[Device] | None:
    try:
        output = subprocess.check_output(["v4l2-ctl", "--list-devices"]).decode("utf-8")
    except subprocess.CalledProcessError as e:
        print("Error: %s" % e.output)
        return None

    lines = output.split("\n")
    devices: list[Device] = []
    for line in lines:
        device_name_match = re.findall(r"(.*\(.*\)):", line)
        device_file_match = re.search(r"/dev/video\d+", line)
        if len(device_name_match) > 0:
            devices.append(Device(device_name_match[0], []))
        elif device_file_match:
            devices[-1].device_files.append(device_file_match.group())
    return devices


if __name__ == "__main__":
    pprint.pprint(v4l2_ctl_list_devices())
    pprint.pprint(v4l2_ctl_format_ext("/dev/video4"))
