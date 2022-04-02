function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Playlist extends React.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "_savePlaylist", async () => {
      await window.electronAPI.handlePlaylistUpdate(this.props.playlist);
    });

    _defineProperty(this, "_onChangeInput", e => {
      // This should update the actual value in the playlist, too
      let updatePlaylist = this.props.playlist;
      updatePlaylist.name = e.target.value;
      this.setState({
        playlist: updatePlaylist
      });
    });

    _defineProperty(this, "_onKeyDown", async e => {
      if (e.key === 'Enter') {
        await this._savePlaylist();
        this.props.clearEditActive();
      }
    });

    _defineProperty(this, "_onContextMenu", e => {
      this.props.showContext(e, 'PLAYLIST_ITEM', this.props.id);
    });

    this.state = {
      value: this.props.playlist.name,
      playlist: this.props.playlist
    };
  }

  render() {
    let className = "playlist";

    if (this.props.activePlaylist !== null && this.props.activePlaylist.id === this.props.id) {
      className += " active";
    }

    let content;

    if (this.props.id === this.props.editActive) {
      content = /*#__PURE__*/React.createElement("input", {
        autoFocus: true,
        onKeyDown: this._onKeyDown,
        onChange: this._onChangeInput,
        className: "playlist",
        value: this.state.playlist.name
      });
    } else {
      content = /*#__PURE__*/React.createElement("div", {
        className: className,
        onContextMenuCapture: this._onContextMenu,
        onClickCapture: () => this.props.handleOnClick(this.props.playlist),
        onContextMenu: () => this.props.handleOnContext(this.props.playlist.name)
      }, this.props.playlist.name);
    }

    return content;
  }

}

export default Playlist;