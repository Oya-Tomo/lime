import subprocess
import re
import pprint
from pydantic import BaseModel


class Quality(BaseModel):
    size: str
    fps: list[float]


class Format(BaseModel):
    name: str
    quality: list[Quality]


class DeviceFile(BaseModel):
    path: str
    formats: list[Format]


class Device(BaseModel):
    name: str
    files: list[DeviceFile]


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
            formats.append(Format(name=format_match[0], quality=[]))
        if len(size_match) > 0:
            formats[-1].quality.append(Quality(size=size_match[0], fps=[]))
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
            devices.append(Device(name=device_name_match[0], files=[]))
        elif device_file_match:
            devices[-1].files.append(
                DeviceFile(path=device_file_match.group(), formats=[])
            )

    for di in range(len(devices)):
        for dfi in range(len(devices[di].files)):
            devices[di].files[dfi].formats = v4l2_ctl_format_ext(
                devices[di].files[dfi].path
            )

    return devices


if __name__ == "__main__":
    devices = v4l2_ctl_list_devices()
    for device in devices:
        print(device.name)
        for device_file in device.files:
            print(f"  {device_file.path}")
            for format in device_file.formats:
                print(f"    {format.name}")
                for quality in format.quality:
                    print(f"      {quality.size}")
                    print(f"      {quality.fps}")
        print()
