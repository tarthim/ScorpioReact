function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
import FileNode from "./filenode.js";
class FileBrowser extends React.PureComponent {
  constructor(props) {
    super(props);
    _defineProperty(this, "_mapSongTree", () => {
      if (this.props.songTree === null) return /*#__PURE__*/React.createElement("div", null, "Loading content...");
      const result = [];
      for (const item in this.props.songTree) {
        result.push(this._generateTree(this.props.songTree[item], -1, true));
      }
      return result;
    });
    _defineProperty(this, "_generateTree", (node, depth, baseLocation = false) => {
      depth++;
      const result = [];
      if (node.isFolder) {
        // Loop through content
        var childContent = [];
        for (const content in node.content) {
          var cont = node.content[content];
          if (cont.isFolder) {
            // Recursive scan
            childContent.push(this._generateTree(cont, depth));
          } else {
            // File nodes
            let node = /*#__PURE__*/React.createElement(FileNode, {
              key: cont.path,
              content: cont,
              depth: depth + 1,
              playSong: this.props.playSong,
              rightClick: this.props.showContext
            });
            childContent.push(node);
          }
        }
        // Folder node
        let base = /*#__PURE__*/React.createElement(FileNode, {
          key: node.path,
          content: node,
          children: childContent,
          startExpanded: baseLocation,
          depth: depth,
          rightClick: this.props.showContext
        });
        result.push(base);
      }
      return result;
    });
    this.state = {
      songs: null
    };
  }
  render() {
    let content = this._mapSongTree();
    return /*#__PURE__*/React.createElement("div", {
      id: "file-browser"
    }, content);
  }
}
export default FileBrowser;