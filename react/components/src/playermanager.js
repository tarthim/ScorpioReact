import PlaylistItem from "./playlistitem.js"

class PlayerManager extends React.Component {
    constructor(props) {
        super(props)
    }
    
    _renderContent = () => {
        let content = []
        let playlistContent = []
        let key = 0
        if (this.props.activePlaylist != null) {
            for (const song in this.props.activePlaylist.content) {
                let uniqueKey = this.props.activePlaylist.id + "-" + key
                let songContent = this.props.activePlaylist.content[song]
                playlistContent.push({uniqueKey, songContent})
                content.push(
                        (
                            <PlaylistItem onDoubleClick={this.props.onDoubleClick} setAsActive={this.props.setActivePlaylistSong} key={uniqueKey} id={uniqueKey} active={this.props.activePlaylistSong} content={songContent}/>
                        )
                    )
                key++
            }
        }
        this.props.setActivePlaylistContent(playlistContent)
        return content
    }

    _onDragOver = (e) => {
        e.preventDefault()
    }

    _onDrop = (e) => {
        // Event when FileNode gets dropped on a playlist
        console.log(e.dataTransfer.getData("text/isFolder"))
        console.log(e.dataTransfer.getData("text/path"))
        console.log(this.props.activePlaylist)
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