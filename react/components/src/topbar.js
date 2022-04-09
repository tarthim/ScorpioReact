class TopBar extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = ({
            value: 0
        })
    }

    componentDidMount() {
        this._forceSeekbarRefresh()

        this.props.audio.addEventListener('play', () => {
            this._forceSeekbarRefresh()
        })

        this.props.audio.addEventListener('ended', () => {
            this.setState({
                value: 0
            })
        })
    }

    _onSeekbarClick = (e) => {
        try {
            let percentage = e.target.value
            // Calculate duration based on percentage
            let duration = this.props.audio.duration
            let newTime = duration * (percentage / 100)

            // this.state.audio.currentTime = newTime;
            this.props.audio.currentTime = newTime
        } catch (e) { 
            console.log(e)
        }
    }

    _forceSeekbarRefresh = () => {
        let seekbarTime
        try {
            let currentTime = this.props.audio.currentTime
            seekbarTime = (currentTime / this.props.audio.duration) * 100
        }
        catch(e) {
            seekbarTime = 0
        }

        if (!seekbarTime) seekbarTime = 0

        this.setState({
            value: seekbarTime
        })

        setTimeout(this._forceSeekbarRefresh, 6000)
    }

    _onSeekbarChange = (e) => {
        this.setState({
            value: e.target.value
        })
    }


    render() {
        return (
            <div className="topbar">
                <div className="topbar-left">
                    <div id="top-pause" className="title-button" onClick={() => this.props.togglePlaying()}>P</div>
                    <input type="range" min="1" max="100" value={this.state.value} onChange={this._onSeekbarChange} onClick={this._onSeekbarClick} id="seekbar"></input>
                </div>
            </div>
        )
    }
}

export default TopBar