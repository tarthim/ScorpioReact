class TopBar extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "topbar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "topbar-left"
    }, /*#__PURE__*/React.createElement("div", {
      id: "top-pause",
      className: "title-button",
      onClick: () => this.props.togglePlaying()
    }, "P")));
  }

}

export default TopBar;