import PlaylistItem from "./playlistitem.js"

class PlayerManager extends React.Component {
    constructor(props) {
        super(props)
    }

    _renderContent = () => {
        let content = []
        let playlistContent = []
        if (this.props.activePlaylist != null) {
            for (const song in this.props.activePlaylist.content) {
                let songContent = this.props.activePlaylist.content[song]
                let uniqueKey = this.props.activePlaylist.id + '-' + songContent.id

                // console.log(songContent)
                playlistContent.push({ uniqueKey, songContent })
                content.push(
                    (
                        <PlaylistItem onDoubleClick={this.props.onDoubleClick} setAsActive={this.props.setActivePlaylistSong} key={uniqueKey} id={uniqueKey} active={this.props.activePlaylistSong} content={songContent} showContext={this.props.showContext} playlistId={this.props.activePlaylist.id} />
                    )
                )
            }
        }
        this.props.setActivePlaylistContent(playlistContent)
        return content
    }

    _onDragOver = (e) => {
        e.preventDefault()
    }

    _onDrop = async (e) => {
        // Event when FileNode gets dropped on a playlist
        let path = e.dataTransfer.getData("text/path")
        let playlist = this.props.activePlaylist

        // Gets back all playlists, including the updated one
        let updatedPlaylists = await window.electronAPI.handleAddPathToPlaylist(playlist.id, path)
        this.props.setPlaylists(updatedPlaylists, playlist.id)
    }

    render() {
        let content = this._renderContent()
        if (this.props.activePlaylist == null) return <div></div>
        return (
            <div className="main-playlist" onDragOver={this._onDragOver} onDrop={this._onDrop}>
                <div className="main-playlist-overlay">
                    <div className="main-playlist-banner">{this.props.activePlaylist.name}</div>
                </div>

                <div className="song-content">
                    <div className="column-titles">
                        <div className="play-indicator"></div>
                        <div className="column">Artist</div>
                        <div className="column">Title</div>
                        <div className="column">Album</div>
                        <div className="column">Encoding</div>
                    </div>
                    {content}
                </div>

            </div>
        )
    }
}

export default PlayerManager