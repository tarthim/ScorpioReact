class TitleBar extends React.PureComponent {
  render() {
    console.log(this.props.albumArt);
    let titleLine = "";
    if (this.props.nowPlaying != null) {
      titleLine = this.props.nowPlaying.artist + " - " + this.props.nowPlaying.title;
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "titlebar"
    }, /*#__PURE__*/React.createElement("div", {
      id: "song-info"
    }, titleLine), /*#__PURE__*/React.createElement("div", {
      id: "app-title"
    }, "Scorpio"), /*#__PURE__*/React.createElement("div", {
      id: "titlebar-buttons"
    }, /*#__PURE__*/React.createElement("div", {
      id: "minimize-button",
      className: "title-button"
    }, "-"), /*#__PURE__*/React.createElement("div", {
      id: "maximize-button",
      className: "title-button"
    }, "O"), /*#__PURE__*/React.createElement("div", {
      id: "close-button",
      className: "title-button"
    }, "X")));
  }
}
export default TitleBar;