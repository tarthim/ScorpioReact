function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class PlaylistItem extends React.PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "_onDoubleClick", () => {
      // First: send double click with url
      this.props.onDoubleClick(this.props.content.url, this.props.id);
      this.props.setAsActive(this.props.id);
    });
  }

  render() {
    let currentClass = "playlist-item";

    if (this.props.active == this.props.id) {
      currentClass += " active";
    }

    return /*#__PURE__*/React.createElement("div", {
      onDoubleClickCapture: () => {
        this._onDoubleClick();
      },
      className: currentClass
    }, /*#__PURE__*/React.createElement("div", {
      className: "play-indicator"
    }, this.props.active == this.props.id && /*#__PURE__*/React.createElement("div", {
      className: "play-icon"
    })), /*#__PURE__*/React.createElement("div", {
      className: "column artist"
    }, this.props.content.metadata.artist), /*#__PURE__*/React.createElement("div", {
      className: "column title"
    }, this.props.content.metadata.title), /*#__PURE__*/React.createElement("div", {
      className: "column album"
    }, this.props.content.metadata.album), /*#__PURE__*/React.createElement("div", {
      className: "column codec"
    }, this.props.content.metadata.codec));
  }

}

export default PlaylistItem;