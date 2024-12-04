document.addEventListener("DOMContentLoaded", async function () {
  await initialize();
});

async function initialize() {
  disabledConnectButton(true);
  disabledDisconnectButton(true);

  const connectButton = document.getElementById("connect");
  connectButton.onclick = connect;

  const disconnectButton = document.getElementById("disconnect");
  disconnectButton.onclick = disconnect;

  var devices = [];
  await fetch("/devices")
    .then((res) => res.json())
    .then((data) => {
      devices = data.devices;
    })
    .finally(() => {});

  prepareDeviceSelect(devices);
}

function disabledConnectButton(disabled) {
  const connectButton = document.getElementById("connect");
  connectButton.disabled = disabled;
}

function disabledDisconnectButton(disabled) {
  const disconnectButton = document.getElementById("disconnect");
  disconnectButton.disabled = disabled;
}

function disabledParams(disabled) {
  const device = document.getElementById("device");
  device.disabled = disabled;

  const source = document.getElementById("source");
  source.disabled = disabled;

  const format = document.getElementById("format");
  format.disabled = disabled;

  const resolution = document.getElementById("resolution");
  resolution.disabled = disabled;

  const framerate = document.getElementById("framerate");
  framerate.disabled = disabled;
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
    disabledConnectButton(true);
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
    disabledConnectButton(true);
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
    disabledConnectButton(true);
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
    disabledConnectButton(true);
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

  select.onchange = (event) => {
    disabledConnectButton(false);
  };
}

// connect

var pc = null;

async function checkDevice() {
  device = document.getElementById("source").value;
  return fetch("/devices/check", {
    body: JSON.stringify({
      file: device,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      return json.used;
    });
}

function negotiate() {
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  device = document.getElementById("source").value;
  framerate = document.getElementById("framerate").value;
  video_size = document.getElementById("resolution").value;

  return pc
    .createOffer()
    .then((offer) => {
      return pc.setLocalDescription(offer);
    })
    .then(() => {
      // wait for ICE gathering to complete
      return new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
        }
      });
    })
    .then(() => {
      var offer = pc.localDescription;
      return fetch("/offer", {
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          device: device,
          framerate: framerate,
          video_size: video_size,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    })
    .then((response) => {
      return response.json();
    })
    .then((answer) => {
      return pc.setRemoteDescription(answer);
    })
    .catch((e) => {
      alert(e);
    });
}

async function connect() {
  used = await checkDevice();
  if (used) {
    alert("Device is already in use");
    return;
  }

  var config = {
    sdpSemantics: "unified-plan",
  };

  pc = new RTCPeerConnection(config);

  pc.addEventListener("track", (event) => {
    if (event.track.kind === "video") {
      document.getElementById("video").srcObject = event.streams[0];
    }
  });

  pc.addEventListener("connectionstatechange", (event) => {
    if (pc.connectionState === "failed") {
      disconnect();
      alert("Connection failed");
    } else if (pc.connectionState === "disconnected") {
      disconnect();
      alert("Connection disconnected");
    } else if (pc.connectionState === "closed") {
      disconnect();
      alert("Connection closed");
    }
  });

  disabledParams(true);
  disabledConnectButton(true);
  negotiate();
  disabledDisconnectButton(false);
}

function disconnect() {
  pc.close();
  pc = null;

  document.getElementById("video").srcObject = null;

  disabledConnectButton(false);
  disabledDisconnectButton(true);
  disabledParams(false);
}

window.addEventListener("beforeunload", () => {
  if (pc) {
    pc.close();
  }
});
