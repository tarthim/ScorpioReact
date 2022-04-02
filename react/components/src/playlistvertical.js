import Playlist from "./playlist.js"

class PlaylistManagerVertical extends React.Component {
    _activateContextMenu = (e) => {
        if (e.target.id === 'playlistManagerVertical') {
            this.props.showContext(e, 'PLAYLIST_MANAGER')
        }
    }

    _handleOnClickPlaylist = (pl) => {
        this.props.setActivePlaylist(pl)
    }

    _generatePlaylistView = () => {
        var result = []
        for (const playlist in this.props.playlists) {
            result.push(<Playlist activePlaylist={this.props.activePlaylist} key={this.props.playlists[playlist].id} showContext={this.props.showContext} editActive={this.props.playlistEdit} clearEditActive={this.props.clearEditPlaylist} id={this.props.playlists[playlist].id} handleOnClick={this._handleOnClickPlaylist} handleOnContext={() => this._activateContextMenu} playlist={this.props.playlists[playlist]}/>)
        }
        return result
    }

    render() {
        let playlistView = this._generatePlaylistView()
        return (
            <div id="playlistManagerVertical" onContextMenu={this._activateContextMenu}>{playlistView}</div>
        )
    }
}

export default PlaylistManagerVertical