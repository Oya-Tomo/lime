from aiortc.contrib.media import MediaRelay, MediaPlayer, MediaStreamTrack


class Tracks:
    def __init__(self) -> None:
        self.relay = MediaRelay()
        self.players: dict[str, MediaPlayer] = {}

    def create_video_track(
        self, device: str, framerate: int, video_size: str
    ) -> MediaStreamTrack:
        player = self.players.get(device)
        if player == None:
            player = MediaPlayer(
                device,
                format="v4l2",
                options={
                    "framerate": str(framerate),
                    "video_size": video_size,
                    # "input_format": "mjpeg",
                    # "rtbufsize": "100",
                },
            )
            self.players[device] = player
        return self.relay.subscribe(player.video)

    def reset(self):
        for player in self.players.values():
            player.video.stop()
        self.players.clear()
        self.relay = MediaRelay()
