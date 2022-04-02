class ContextMenu extends React.Component {
    constructor(props) {
        super(props)
    }

    // Shows when right clicking a song
    _renderSongContext = () => {
        return (
            <>
                <div className="context-item" onClickCapture={() => this.props.playSong(this.props.renderSettings.Content.path)}>Play</div>
                <div className="context-item" onClickCapture={() => this.props.addSongToPlaylist(this.props.renderSettings.Content.path)}>Add to current playlist</div>
            </>
        )
    }

    // Shows when right clicking on the playlist pane
    _renderPlaylistPaneContext = () => {
        return (
            <>
                <div className="context-item" onClickCapture={() => this.props.addNewPlaylist()}>Add new playlist</div>
            </>
        )
    }

    // Shows when right clicking on a playlist item
    _renderPlaylistItemContext = () => {
        return (
            <>
                <div className="context-item" onClickCapture={() => this.props.setEditPlaylist(this.props.renderSettings.Content)}>Edit playlist</div>
            </>
        )
    }

    render() {
        let style = {
            left: this.props.renderSettings.X,
            top: this.props.renderSettings.Y
        }

        return (
            <div className="context-menu" style={style}>
                {this.props.renderSettings.Type === 'SONG' && this._renderSongContext() ||
                this.props.renderSettings.Type === 'PLAYLIST_MANAGER' && this._renderPlaylistPaneContext() ||
                this.props.renderSettings.Type === 'PLAYLIST_ITEM' && this._renderPlaylistItemContext()}
            </div>
        )
    }
}

export default ContextMenu