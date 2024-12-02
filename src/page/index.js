// states

document.addEventListener("DOMContentLoaded", async function () {
  await initialize();
});

async function initialize() {
  const connectButton = document.getElementById("connect");
  connectButton.disabled = true;

  const disconnectButton = document.getElementById("disconnect");
  disconnectButton.disabled = true;

  var devices = [];
  await fetch("/devices")
    .then((res) => res.json())
    .then((data) => {
      devices = data.devices;
    })
    .finally(() => {});

  prepareDeviceSelect(devices);
}

function prepareDeviceSelect(devices) {
  const select = document.getElementById("device");
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.innerText = "Select a device";
  option.selected = true;
  option.disabled = true;
  select.appendChild(option);

  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.name;
    option.innerText = device.name;
    select.appendChild(option);
  });

  select.onchange = (event) => {
    const device = devices.find((d) => d.name === event.target.value);
    prepareSourceSelect(device);
    clearFormatSelect();
    clearResolutionSelect();
    clearFramerateSelect();
  };
}

function clearSourceSelect() {
  const select = document.getElementById("source");
  select.innerHTML = "";
}

function prepareSourceSelect(device) {
  const select = document.getElementById("source");
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.innerText = "Select a file";
  option.selected = true;
  option.disabled = true;
  select.appendChild(option);

  device.files.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.path;
    option.innerText = file.path;
    select.appendChild(option);
  });

  select.onchange = (event) => {
    const source = device.files.find((f) => f.path === event.target.value);
    prepareFormatSelect(source);
    clearResolutionSelect();
    clearFramerateSelect();
  };
}

function clearFormatSelect() {
  const select = document.getElementById("format");
  select.innerHTML = "";
}

function prepareFormatSelect(source) {
  const select = document.getElementById("format");
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.innerText = "Select a format";
  option.selected = true;
  option.disabled = true;
  select.appendChild(option);

  source.formats.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.name;
    option.innerText = format.name;
    select.appendChild(option);
  });

  select.onchange = (event) => {
    const format = source.formats.find((f) => f.name === event.target.value);
    prepareResolutionSelect(format);
    clearFramerateSelect();
  };
}

function clearResolutionSelect() {
  const select = document.getElementById("resolution");
  select.innerHTML = "";
}

function prepareResolutionSelect(format) {
  const select = document.getElementById("resolution");
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.innerText = "Select a resolution";
  option.selected = true;
  option.disabled = true;
  select.appendChild(option);

  format.quality.forEach((resolution) => {
    const option = document.createElement("option");
    option.value = resolution.size;
    option.innerText = resolution.size;
    select.appendChild(option);
  });

  select.onchange = (event) => {
    const resolution = format.quality.find(
      (r) => r.size === event.target.value
    );
    prepareFramerateSelect(resolution);
  };
}

function clearFramerateSelect() {
  const select = document.getElementById("framerate");
  select.innerHTML = "";
}

function prepareFramerateSelect(resolution) {
  const select = document.getElementById("framerate");
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.innerText = "Select a framerate";
  option.selected = true;
  option.disabled = true;
  select.appendChild(option);

  resolution.fps.forEach((fps) => {
    const option = document.createElement("option");
    option.value = fps;
    option.innerText = fps;
    select.appendChild(option);
  });
}
