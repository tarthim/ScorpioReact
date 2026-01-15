function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
import PlaylistItem from "./playlistitem.js";
class PlayerManager extends React.Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "_renderContent", () => {
      let content = [];
      let playlistContent = [];
      if (this.props.activePlaylist != null) {
        for (const song in this.props.activePlaylist.content) {
          let songContent = this.props.activePlaylist.content[song];
          let uniqueKey = this.props.activePlaylist.id + '-' + songContent.id;

          // console.log(songContent)
          playlistContent.push({
            uniqueKey,
            songContent
          });
          content.push( /*#__PURE__*/React.createElement(PlaylistItem, {
            onDoubleClick: this.props.onDoubleClick,
            setAsActive: this.props.setActivePlaylistSong,
            key: uniqueKey,
            id: uniqueKey,
            active: this.props.activePlaylistSong,
            content: songContent,
            showContext: this.props.showContext,
            playlistId: this.props.activePlaylist.id
          }));
        }
      }
      this.props.setActivePlaylistContent(playlistContent);
      return content;
    });
    _defineProperty(this, "_onDragOver", e => {
      e.preventDefault();
    });
    _defineProperty(this, "_onDrop", async e => {
      // Event when FileNode gets dropped on a playlist
      let path = e.dataTransfer.getData("text/path");
      let playlist = this.props.activePlaylist;

      // Gets back all playlists, including the updated one
      let updatedPlaylists = await window.electronAPI.handleAddPathToPlaylist(playlist.id, path);
      this.props.setPlaylists(updatedPlaylists, playlist.id);
    });
  }
  render() {
    let content = this._renderContent();
    if (this.props.activePlaylist == null) return /*#__PURE__*/React.createElement("div", null);
    return /*#__PURE__*/React.createElement("div", {
      className: "main-playlist",
      onDragOver: this._onDragOver,
      onDrop: this._onDrop
    }, /*#__PURE__*/React.createElement("div", {
      className: "main-playlist-overlay"
    }, /*#__PURE__*/React.createElement("div", {
      className: "main-playlist-banner"
    }, this.props.activePlaylist.name)), /*#__PURE__*/React.createElement("div", {
      className: "song-content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "column-titles"
    }, /*#__PURE__*/React.createElement("div", {
      className: "play-indicator"
    }), /*#__PURE__*/React.createElement("div", {
      className: "column"
    }, "Artist"), /*#__PURE__*/React.createElement("div", {
      className: "column"
    }, "Title"), /*#__PURE__*/React.createElement("div", {
      className: "column"
    }, "Album"), /*#__PURE__*/React.createElement("div", {
      className: "column"
    }, "Encoding")), content));
  }
}
export default PlayerManager;