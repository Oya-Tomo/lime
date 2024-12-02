import asyncio
from contextlib import asynccontextmanager
import fastapi
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel

from aiortc import RTCPeerConnection, RTCSessionDescription

from track import Tracks
from device import Device, v4l2_ctl_list_devices, v4l2_ctl_format_ext


@asynccontextmanager
async def lifespan(server: fastapi.FastAPI):
    yield
    # on shutdown
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


server = fastapi.FastAPI(
    lifespan=lifespan,
)

pcs: set[RTCPeerConnection] = set()
tracks = Tracks()

# html & static files


@server.get("/")
async def get_index():
    index_html = open("src/pages/index/index.html").read()
    return HTMLResponse(content=index_html, status_code=200)


@server.get("/static/{file_path}")
async def get_static(file_path: str):
    files = {
        "index.css": {
            "path": "src/pages/index/index.css",
            "content_type": "text/css",
        },
        "index.js": {
            "path": "src/pages/index/index.js",
            "content_type": "application/javascript",
        },
    }
    file = files.get(file_path)
    if not file:
        return Response(content="Not Found", status_code=404)
    return Response(
        content=open(file["path"]).read(),
        media_type=file["content_type"],
        status_code=200,
    )


# devices


class DevicesResponse(BaseModel):
    devices: list[Device]


@server.get("/devices", response_model=DevicesResponse)
async def get_devices():
    devices = v4l2_ctl_list_devices()
    return DevicesResponse(devices=devices)


# WebRTC


class OfferRequest(BaseModel):
    sdp: str
    type: str
    device: str
    framerate: int
    video_size: str


class OfferResponse(BaseModel):
    sdp: str
    type: str


@server.post("/offer", response_model=OfferResponse)
async def offer(request: OfferRequest):
    offer = RTCSessionDescription(sdp=request.sdp, type=request.type)

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state is %s" % pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    video = tracks.create_video_track(
        request.device, request.framerate, request.video_size
    )
    pc.addTrack(video)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    response = OfferResponse(sdp=pc.localDescription.sdp, type=pc.localDescription.type)
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:server", host="localhost", port=8000, reload=True)
