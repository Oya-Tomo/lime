import fastapi
from fastapi.responses import HTMLResponse, Response


server = fastapi.FastAPI()

# pages


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:server", host="localhost", port=8000, reload=True)
