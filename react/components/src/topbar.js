class TopBar extends React.PureComponent {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="topbar">
                <div className="topbar-left">
                    <div id="top-pause" className="title-button" onClick={() => this.props.togglePlaying()}>P</div>
                </div>
            </div>
        )
    }
}

export default TopBar