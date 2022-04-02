function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class FileNode extends React.PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "_switchExpanded", () => {
      this.setState({
        expandFolder: this.state.expandFolder ? false : true
      });
    });

    _defineProperty(this, "_showContextMenu", e => {
      e.preventDefault();
      this.props.rightClick(e, "SONG", this.props.content);
    });

    this.state = {
      expandFolder: this.props.startExpanded
    };
  }

  render() {
    let cont = this.props.content;
    let children = this.props.children;
    let offset = "p-" + this.props.depth;
    let className = "node " + offset;
    let showChildren = " hidden";

    if (cont.isFolder) {
      className += " folder";
      if (this.state.expandFolder) showChildren = "";
    } else {
      className += " file";
    }

    let onClick;
    let onContext;

    if (cont.isFolder) {
      onClick = () => this._switchExpanded();
    } else {
      // File item
      onClick = () => {
        this.props.playSong(cont.path);
      };

      onContext = e => this._showContextMenu(e);
    }

    return /*#__PURE__*/React.createElement("div", {
      className: className,
      key: cont.path
    }, /*#__PURE__*/React.createElement("div", {
      className: "node-title",
      onContextMenu: onContext,
      onClick: onClick
    }, cont.name), /*#__PURE__*/React.createElement("div", {
      className: "content" + showChildren,
      key: cont.path + "-content"
    }, children));
  }

}

export default FileNode;