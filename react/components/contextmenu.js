function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "_renderSongContext", () => {
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "context-item",
        onClickCapture: () => this.props.playSong(this.props.renderSettings.Content.path)
      }, "Play"), /*#__PURE__*/React.createElement("div", {
        className: "context-item",
        onClickCapture: () => this.props.addSongToPlaylist(this.props.renderSettings.Content.path)
      }, "Add to current playlist"));
    });
    _defineProperty(this, "_renderPlaylistPaneContext", () => {
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "context-item",
        onClickCapture: () => this.props.addNewPlaylist()
      }, "Add new playlist"));
    });
    _defineProperty(this, "_renderPlaylistItemContext", () => {
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "context-item",
        onClickCapture: () => this.props.setEditPlaylist(this.props.renderSettings.Content)
      }, "Edit playlist"), /*#__PURE__*/React.createElement("div", {
        className: "context-item",
        onClickCapture: () => this.props.removePlaylist(this.props.renderSettings.Content)
      }, "Remove playlist"));
    });
  }

  // Shows when right clicking a song

  // Shows when right clicking on the playlist pane

  // Shows when right clicking on a playlist item

  render() {
    let style = {
      left: this.props.renderSettings.X,
      top: this.props.renderSettings.Y
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "context-menu",
      style: style
    }, this.props.renderSettings.Type === 'SONG' && this._renderSongContext() || this.props.renderSettings.Type === 'PLAYLIST_MANAGER' && this._renderPlaylistPaneContext() || this.props.renderSettings.Type === 'PLAYLIST_ITEM' && this._renderPlaylistItemContext());
  }
}
export default ContextMenu;