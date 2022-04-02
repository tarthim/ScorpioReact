class PlaylistItem extends React.PureComponent {
    _onDoubleClick = () => {
        // First: send double click with url
        this.props.onDoubleClick(this.props.content.url, this.props.id)
        this.props.setAsActive(this.props.id)
    }

    render() {
        let currentClass = "playlist-item"
        if (this.props.active == this.props.id) {
            currentClass += " active"
        }

        return (
            <div onDoubleClickCapture={() => {this._onDoubleClick()}} className={currentClass}>
                <div className="play-indicator">
                    {this.props.active == this.props.id && <div className="play-icon"></div>}
                </div>
                <div className="column artist">{this.props.content.metadata.artist}</div>
                <div className="column title">{this.props.content.metadata.title}</div>
                <div className="column album">{this.props.content.metadata.album}</div>
                <div className="column codec">{this.props.content.metadata.codec}</div>
            </div>
        )
    }
}

export default PlaylistItem