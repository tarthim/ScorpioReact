import FileNode from "./filenode.js"

class FileBrowser extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            songs: null
        }
    }
    
    _mapSongTree = () => {
        const result = []
        if (this.props.songTree === null) return (<div>Loading content...</div>)

        for (const item in this.props.songTree) {
            result.push(this._generateTree(this.props.songTree[item], -1, true))
        }
        return result
    }

    _generateTree = (node, depth, baseLocation = false) => {
        depth++
        const result = []
        if (node.isFolder) {
            // Loop through content
            var childContent = []
            for (const content in node.content) {
                var cont = node.content[content]
                if (cont.isFolder) {
                    // Recursive scan
                    childContent.push(this._generateTree(cont, depth))
                }
                else {
                    // File nodes
                    let node = <FileNode key={cont.path} content={cont} depth={depth + 1} playSong={this.props.playSong} rightClick={this.props.showContext}/>
                    childContent.push(node)
                }
            }
            // Folder node
            let base = <FileNode key={node.path} content={node} children={childContent} startExpanded={baseLocation} depth={depth} rightClick={this.props.showContext}/>
            result.push(base)
        }
        return result
    }

    render() {
        let content = this._mapSongTree()
        return (
            <div id='file-browser'>
                {content}
            </div>
        )
    }
}

export default FileBrowser