class TitleBar extends React.PureComponent {
    render() {
        console.log(this.props.albumArt)
        let titleLine = ""
        if (this.props.nowPlaying != null) {
            titleLine = this.props.nowPlaying.artist + " - " + this.props.nowPlaying.title
        }
        return (
            <div className="titlebar">

                <div id="song-info">{titleLine}</div>
                <div id="app-title">Scorpio</div>
                <div id="titlebar-buttons">
                    <div id="minimize-button" className="title-button">-</div>
                    <div id="maximize-button" className="title-button">O</div>
                    <div id="close-button" className="title-button">X</div>
                </div>

                {this.props.albumArt && <img id="titlebar-style" src={this.props.albumArt}></img>}
            </div>
        )
    }
}

export default TitleBar