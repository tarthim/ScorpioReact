import FileBrowser from "./filebrowser.js"
import TitleBar from "./titlebar.js"
import TopBar from "./topbar.js"
import ContextMenu from "./contextmenu.js"
import PlaylistManagerVertical from "./playlistvertical.js"
import PlayerManager from "./playermanager.js"
import ColorManager from "./colormanager.js"

class Scorpio extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // current playing
            playing: null,
            // play/pause currently playing context
            togglePlaying: this._togglePlaying,
            // audio context (initialized from outside component)
            audio: this.props.audio,
            // file browser tree
            songTree: null,
            // context menu show/hider
            showContextMenu: false,
            // all playlists
            playlists: null,
            // selected (context) playlist
            activePlaylist: null,
            // currently playing playlist
            playingPlaylist: null,
            // metadata for currently playing song
            nowPlayingInfo: null,
            // context state for context menu (props)
            contextMenuState: null,
            // Next to play songs
            songQueue: null,
            // album art
            albumArt: null,
            // last selected playlist content (so, not activePlaylist, but the items inside that playlist).
            // TODO: Use this to fill up song queue :-)
            activePlaylistContent: null,
            // active playlist song (with indicator)
            activePlaylistSong: null,
            // Currently active editor mode for playlist (to change its name)
            playlistInEdit: null
        }
    }

    async componentDidMount() {
        // Register to main thread messages
        window.electronAPI.onTestMessage((_event, value) => {
            console.log(value)
        })

        window.electronAPI.onSongMetadata((_event, metadata) => {
            this._handleNewMetadata(metadata)
        })

        window.electronAPI.onAlbumArt((e, albumart) => {
            // console.log(albumart)
            this.setState({
                albumArt: albumart
            })
        })

        let contextMenuInit = new ContextMenuState(0, 0, null, null)

        this.setState({
            songTree: await this._loadFileStructure('D:\\Music'),
            playlists: await window.electronAPI.handleRetrievePlaylists(),
            contextMenuState: contextMenuInit
        })

        this.state.audio.addEventListener("ended", (e) => {
            // Event handler when song has ended
            // Check if there is another song to play in the queue, start song, pop out of playlist
            if (this.state.songQueue && this.state.songQueue !== undefined && this.state.songQueue.length > 0) {
                // Play next item in queue
                console.log(this.state.songQueue)
                let currentQueue = this.state.songQueue
                let nextSong = currentQueue.shift()
                console.log(nextSong)
                this._playSong(nextSong.songContent.url)
                this.setState({
                    songQueue: currentQueue,
                    activePlaylistSong: nextSong.uniqueKey
                })
            }

            else {
                // no more songs to play
                this.setState({
                    albumArt: null,
                    playing: null,
                    playingPlaylist: null,
                    nowPlayingInfo: null,
                    activePlaylistSong: null
                })
                document.title = 'Scorpio'
                window.electronAPI.handlePlaylistFinished()
            }
        })

        window.lastActivePlaylistContent = null
    }

    _loadFileStructure = async (dir) => {
        var dirTree = await window.electronAPI.handleDirectoryBase(dir)
        return dirTree
    }

    _setActivePlaylist = (playlist) => {
        this.setState({
            activePlaylist: playlist
        })
    }

    _setPlayingPlaylist = (playlist) => {
        this.setState({
            playingPlaylist: playlist
        })
    }

    _setEditPlaylist = (pl) => {
        this.setState({
            playlistInEdit: pl
        })
    }

    _clearEditPlaylist = () => {
        this.setState({
            playlistInEdit: null
        })
    }

    _requestMetadata = async (url) => {
        let result = await window.electronAPI.handleGetMetadata(url)
        return result
    }

    _addSongToPlaylist = async (url) => {
        // Only works when we have a playlist active
        if (this.state.activePlaylist != null) {
            // first request information we need to add to front-end, update state, etc
            let activePlaylist = this.state.activePlaylist
            // console.log(activePlaylist)
            // Get metadata for song
            let metadata = await this._requestMetadata(url)
            activePlaylist.content.push({url, metadata})
            
            this.setState({activePlaylist: activePlaylist})

            // When front-end is done, send FULL new playlist to be saved by the back-end!
            await window.electronAPI.handlePlaylistUpdate(activePlaylist)
        }
    }

    // This is really: propegateMetadata (from main --> renderer)
    _handleNewMetadata = (metadata) => {
        // Create new song info
        let songInfo = new SongInformation(metadata.common.artist, metadata.common.title, metadata.common.album)
        // Set as application title
        document.title = metadata.common.artist + " - " + metadata.common.title
        // Set state to update the UI
        this.setState({
            nowPlayingInfo: songInfo
        })
    }

    _playSong = (url) => {
        // Handler for playing music
        // Prio 1: play song
        this.state.audio.src = url
        this.state.audio.play()
        // Let main thread know we started playing a song
        window.electronAPI.handlePlaySong(url)
        console.log(this.state.audio)
    }

    _playSongFromFileTree = (url) => {
        // Clear playlist indicator
        this.setState({
            activePlaylistSong: null
        })
        this._playSong(url)
    }
    
    _playSongFromPlaylist = (url, songID) => {
        // console.log(songID)
        // First: play song
        this._playSong(url)
        // Then: set up song queue
        if (window.lastActivePlaylistContent) {
            // Get index of clicked item
            // Remove everything before current song + current song
            let queueSplice = window.lastActivePlaylistContent.findIndex(x => x.uniqueKey === songID)
            let newQueue = window.lastActivePlaylistContent.splice(queueSplice + 1)
            this.setState({
                songQueue: newQueue
            })
        }
    }

    _addNewPlaylist = async () => {
        // Get new playlist info
        let newPlaylist = await window.electronAPI.handleNewPlaylist()
        // Add to our playlist array
        let currentPlaylists = this.state.playlists
        currentPlaylists.push(newPlaylist)

        // Set new state with new playlist included
        this.setState({
            playlists: currentPlaylists
        })
    }

    _removePlaylist = async (plID) => {
        let playlistUpdate = await window.electronAPI.handleDeletePlaylist(plID)

        this.setState({
            playlists: playlistUpdate
        })
    }


    _togglePlaying = () => {
        // Handler for toggling playing
        this.state.audio.paused ? this.state.audio.play() : this.state.audio.pause()
    }

    _handleLeftClickGlobal = (e) => {
        if (this.state.showContextMenu) {
            this.setState({
                showContextMenu: false
            })
        }

        if (e.target.className !== 'playlist') {
            // YOU SHOULD ALSO SAVE THE PLAYLIST...
            this.setState({
                playlistInEdit: null
            })
        }
    }

    _activateContextMenu = (e, type, content) => {
        let lastState = this.state.contextMenuState

        // Change state
        lastState.X = e.clientX
        lastState.Y = e.clientY
        lastState.Type = type
        lastState.Content = content
        
        this.setState({
            showContextMenu: true,
            contextMenuState: lastState
        })
    }

    _setActivePlaylistContent = (content) => {
        window.lastActivePlaylistContent = content
    }

    _setActivePlaylistSong = (id) => {
        this.setState({
            activePlaylistSong: id
        })
    }

    render() {
        return (
            <div onClickCapture={(e) => this._handleLeftClickGlobal(e)} id="scorpio">
                {this.state.showContextMenu ? 
                <ContextMenu 
                playSong={this._playSongFromFileTree}
                addNewPlaylist={this._addNewPlaylist}
                removePlaylist={this._removePlaylist}
                renderSettings={this.state.contextMenuState}
                addSongToPlaylist={this._addSongToPlaylist}
                setEditPlaylist={this._setEditPlaylist}
                /> : ""}
                
                <div className="content-boxes">
                    <div className="top-pane">
                        <TitleBar nowPlaying={this.state.nowPlayingInfo} albumArt={this.state.albumArt}/>
                        <TopBar audio={this.state.audio} togglePlaying={this.state.togglePlaying} seekCurrentPlaying={this._setCurrentPlayingToTime} activePlaylist={this.state.activePlaylist}/>
                    </div>

                    <div className="main-pane">
                        <div className="left-pane">
                            <FileBrowser songTree={this.state.songTree} playSong={this._playSongFromFileTree} showContext={this._activateContextMenu}/>
                        </div>

                        <div className="center-pane">
                            <PlayerManager onDoubleClick={this._playSongFromPlaylist} activePlaylist={this.state.activePlaylist} activePlaylistSong={this.state.activePlaylistSong} setActivePlaylistContent={this._setActivePlaylistContent} setActivePlaylistSong={this._setActivePlaylistSong}/>
                        </div>

                        <div className="right-pane">
                            <div className="album-viewer">
                                {this.state.albumArt != null && <img src={this.state.albumArt}></img>}
                            </div>
                            <PlaylistManagerVertical activePlaylist={this.state.activePlaylist} playlistEdit={this.state.playlistInEdit} clearEditPlaylist={this._clearEditPlaylist} showContext={this._activateContextMenu} playlists={this.state.playlists} setActivePlaylist={this._setActivePlaylist}/>
                        </div>

                    </div>
                </div>

                <ColorManager />
            </div>
        )
    }
}

class SongInformation {
    constructor(artist, title, album) {
        this.artist = artist;
        this.title = title;
        this.album = album;
    }
}

class ContextMenuState {
    constructor(x, y, content, type, path = null) {
        this.X = x
        this.Y = y
        this.Content = content
        this.Type = type
    }
}

export default Scorpio