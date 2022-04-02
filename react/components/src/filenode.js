class FileNode extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            expandFolder: this.props.startExpanded
        }
    }

    _switchExpanded = () => {
        this.setState({
            expandFolder: this.state.expandFolder ? false : true
        })
    }

    _showContextMenu = (e) => {
        e.preventDefault()
        this.props.rightClick(e, "SONG", this.props.content)
    }

    render() {
        let cont = this.props.content
        let children = this.props.children
        let offset = "p-" + this.props.depth
        let className = "node " + offset
        let showChildren = " hidden"
        if (cont.isFolder) {
            className += " folder" 
            if (this.state.expandFolder) showChildren = ""
        } 
        else {
            className += " file"
        }

        let onClick
        let onContext

        if (cont.isFolder) {
            onClick = () => this._switchExpanded()
        }
        else {
            // File item
            onClick = () =>  {
                this.props.playSong(cont.path)
            }
            onContext = (e) => this._showContextMenu(e)
        }

        return (
            <div 
            className={className} 
            
            key={cont.path}>
                <div className="node-title" onContextMenu={onContext} onClick={onClick}>{cont.name}</div>
                <div className={"content" + showChildren} key={cont.path + "-content"}>{children}</div>
            </div>
        )
    }
}

export default FileNode