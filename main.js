import Scorpio from './react/components/app.js'

let mainApp = document.getElementById('app')
const _audioContext = new AudioContext()
const _audio = new Audio()
const _track = _audioContext.createMediaElementSource(_audio) // input node
_track.connect(_audioContext.destination) // connect to output note (dac)

ReactDOM.render(React.createElement(Scorpio, {
    audioContext: _audioContext,
    audio: _audio,
    track: _track
}), mainApp)