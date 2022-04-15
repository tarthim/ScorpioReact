class Playlist {
    constructor (id, name, content = []) {
        this.id = id
        this.name = name
        this.content = content
        this.lastSongID = 0
    }
}

class PlaylistItem {
    constructor (url, metadata) {
        this.url = url
        this.metadata = metadata
    }
}

exports.Playlist = Playlist
exports.PlaylistItem = PlaylistItem