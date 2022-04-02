class Playlist extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: this.props.playlist.name,
            playlist: this.props.playlist
        }
    }

    _savePlaylist = async () => {
        await window.electronAPI.handlePlaylistUpdate(this.props.playlist)
    }

    _onChangeInput = (e) => {
        // This should update the actual value in the playlist, too
        let updatePlaylist = this.props.playlist
        updatePlaylist.name = e.target.value
        this.setState({
            playlist: updatePlaylist
        })
    }

    _onKeyDown = async (e) => {
        if (e.key === 'Enter') {
            await this._savePlaylist()
            this.props.clearEditActive()
        }
    }

    _onContextMenu = (e) => {
        this.props.showContext(e, 'PLAYLIST_ITEM', this.props.id)
    }

    render() {
        let className = "playlist"
        if (this.props.activePlaylist !== null && this.props.activePlaylist.id === this.props.id) {
            className += " active"
        }

        let content
        if (this.props.id === this.props.editActive) {
            content = (<input autoFocus onKeyDown={this._onKeyDown} onChange={this._onChangeInput} className="playlist" value={this.state.playlist.name}></input>)
        }
        else {
            content = <div className={className} onContextMenuCapture={this._onContextMenu} onClickCapture={() => this.props.handleOnClick(this.props.playlist)} onContextMenu={() => this.props.handleOnContext(this.props.playlist.name)}>{this.props.playlist.name}</div>
        }
        return (
            content
        )
    }
}

export default Playlist