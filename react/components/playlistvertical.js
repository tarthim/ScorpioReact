function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
import Playlist from "./playlist.js";
class PlaylistManagerVertical extends React.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "_activateContextMenu", e => {
      if (e.target.id === 'playlistManagerVertical') {
        this.props.showContext(e, 'PLAYLIST_MANAGER');
      }
    });
    _defineProperty(this, "_handleOnClickPlaylist", pl => {
      this.props.setActivePlaylist(pl);
    });
    _defineProperty(this, "_generatePlaylistView", () => {
      var result = [];
      for (const playlist in this.props.playlists) {
        result.push( /*#__PURE__*/React.createElement(Playlist, {
          activePlaylist: this.props.activePlaylist,
          key: this.props.playlists[playlist].id,
          showContext: this.props.showContext,
          editActive: this.props.playlistEdit,
          clearEditActive: this.props.clearEditPlaylist,
          id: this.props.playlists[playlist].id,
          handleOnClick: this._handleOnClickPlaylist,
          handleOnContext: () => this._activateContextMenu,
          playlist: this.props.playlists[playlist]
        }));
      }
      return result;
    });
  }
  render() {
    let playlistView = this._generatePlaylistView();
    return /*#__PURE__*/React.createElement("div", {
      id: "playlistManagerVertical",
      onContextMenu: this._activateContextMenu
    }, playlistView);
  }
}
export default PlaylistManagerVertical;