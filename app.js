const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const BrowserNode = require('./shared/classes/browserNode.js')
const PlaylistComponent = require('./shared/classes/playlistComponents.js')
const mm = require('music-metadata')
const nconf = require('nconf')
const metadataTransformer = require('./shared/helpers/extractMetadata.js')
const Vibrant = require('node-vibrant')

const axios = require('axios')
const open = require('open')
const crypto = require('crypto')

const store = './storage/'
const localConfigFile = 'scorpio.json'
const localFiletreeFile = 'filetree.json'
const localColorFile = 'colors.json'

const lfmApikeyLocation = './scorpio_lastfm_api.txt'
const lfmSessionkeyLocation = './lastfm_session.txt'
const lfmSharedSecretLocation = './lastfm_sharedsecret.txt'

let player = null
let lastfmApikey = null
let lastfmSessionkey = null

async function readDirectoryTree(dir, ignoreCache) {
    console.log('Reading directory ' + dir)
    // First check if there is a tree to pass back in our cache

    // TODO: Replace with external scanner
    let forceRefresh = false;

    let tree = nconf.stores.filetree.get(dir);
    
    if (tree && !forceRefresh && !ignoreCache) {
        console.log('Returning cached file tree');
        return tree;
    }
    else {
        // Await fs information here, pass back to preload.js handler
        let fileTree = await readFilesystem(dir)
        // This function also gets used for smaller directory requests, we do not want these requests cached
        // This probably needs to be refactored into a handler (nconf) and a function
        if (!ignoreCache) {
            nconf.stores.filetree.set(dir, fileTree)
            saveConfig()
        }

        return fileTree
    }
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1450,
        height: 1000,
        icon: path.join(__dirname, '/resources/logo.ico'),
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Bind basic IPC message handling
    bindIPC(win)

    // Debug
    win.webContents.openDevTools()

    // Load main page
    win.loadFile('main.html')
    return win
}

const bindIPC = (win) => {
    // (event, message)
    ipcMain.on('close', () => {
        app.quit()
    })

    ipcMain.on('minimize', () => {
        win.minimize()
    })

    ipcMain.on('maximize', () => {
        win.isMaximized() ? win.unmaximize() : win.maximize()
    })

    ipcMain.handle('handle:getPlaylists', () => {
        return nconf.get('app:playlists')
    })

    ipcMain.handle('handle:scanDirectory', async (e, p) => {
        return await readDirectoryTree(p, false)
    })

    ipcMain.handle('handle:getMetadata', async (e, url) => {
        let metadata = await mm.parseFile(url)
        return metadataTransformer.transformMetadata(metadata)
    })

    ipcMain.handle('handle:songFinished', () => {
        artist = player.Playing.artist
        title = player.Playing.title
        album = player.Playing.album
        
        // Scrobble this song
        _lfmScrobbleSong(artist, title, album)
    });

    // Receives a full playlist from client, updates
    ipcMain.handle('handle:playlistUpdate', async (e, playlist) => {
        let playlistID = playlist.id
        let allPlaylists = nconf.get('app:playlists')
        let updateItemIndex = allPlaylists.indexOf(allPlaylists.find(e => e.id == playlistID))
        allPlaylists.splice(updateItemIndex, 1)
        allPlaylists.push(playlist)
        nconf.stores.app.set('app:playlists', allPlaylists)
        saveConfig()
    })

    ipcMain.handle('handle:savePalette', async (e, palette) => {
        if (palette) {
           if (player.Playing.Basedir) {
                nconf.stores.colors.set(player.Playing.Basedir, palette)
                saveConfig()
           }
        }
    })

    ipcMain.handle('handle:playSong', async (e, url) => {
        // Renderer is playing a new song. Collect information in the background.
        // First send metadata asap
        let metadata = await mm.parseFile(url)
        win.webContents.send('song-metadata', metadata)

        // Grab useful info
        let lastIndex = url.lastIndexOf('\\') // Needed for base path
        let basePath = url.slice(0, lastIndex) + '\\'

        // Then manage local state        
        let lastPlayed = player.Playing // If something is playing, make sure we can set it as history
        // Build a new player
        player = new Player()
        player.LastPlayed = lastPlayed
        let currentPlaying = new PlayInfo(basePath)
        player.Playing = currentPlaying
        player.Playing.artist = metadata.common.artist
        player.Playing.title = metadata.common.title
        player.Playing.album = metadata.common.album

        console.log(player)

        _lfmUpdateNowPlaying(player.Playing.artist, player.Playing.title, player.Playing.album)

        // Actions to do when basepath is different, aka, playing from different directory/album:
        if (player.LastPlayed.Basedir !== player.Playing.Basedir) {
            console.log('Playing a song from a different directory')
            let coverArtUrl = await _findAlbumArt(player.Playing.Basedir)

            win.webContents.send('album-art', coverArtUrl)

            if (coverArtUrl) {
                // First check if we have colors in our cache for this basePath
                let colorInfo = nconf.stores.colors.get(player.Playing.Basedir)
    
                // console.log(colorInfo)
                if (!colorInfo) {
                    let palette = await _getVibrantColors(coverArtUrl)
                    // console.log(palette.Vibrant)        //-->     Highlight
                    // console.log(palette.DarkMuted)      //-->     Darken
                    // console.log(palette.LightMuted)     //-->     General
                    // console.log(palette.LightVibrant)   //-->     Contrast
                    // console.log(palette)
        
                    colorInfo = new ColorPalette(
                        palette.Vibrant.hex, // Highlight
                        palette.LightVibrant.hex, // Darken
                        palette.DarkVibrant.hex, // General
                        palette.LightMuted.hex // Contrast
                    )
    
                    // console.log('Bug debugger:')
                    // console.log(player)
                    
                    nconf.stores.colors.set(player.Playing.Basedir, colorInfo)
                    saveConfig()
                }
                // Send new color info to front-end
                win.webContents.send('color-palette', colorInfo)
            }
        }        
    })

    ipcMain.handle('handle:playlistFinished', () => {
        // Make sure that we handle next played song correctly
        player.Playing = new PlayInfo('')
        player.LastPlayed = player.Playing
    })

    ipcMain.handle('handle:addPlaylist', () => {
        // Generate new playlist and return to client
        console.log('Creating new playlist')
        return createEmptyPlaylist('New playlist')
    })

    ipcMain.handle('handle:deletePlaylist', (e, playlistID) => {
        // Delete playlist
        console.log('Deleting playlist')
        let allPlaylists = nconf.get('app:playlists')
        let deleteItemIndex = allPlaylists.indexOf(allPlaylists.find(e => e.id == playlistID))
        allPlaylists.splice(deleteItemIndex, 1)
        nconf.stores.app.set('app:playlists', allPlaylists)
        saveConfig()
        return allPlaylists
    })

    // The ONLY way to add songs to playlists. Works for both context menu and drag and drop actions.
    // Takes both a path to a file or a path to a folder. Needs a playlistID.
    ipcMain.handle('handle:addPathToPlaylist', async (e, playlistID, url) => { 
        // Add path to playlist
        let allPlaylists = nconf.get('app:playlists')
        let playlist = allPlaylists.find(e => e.id == playlistID)
        let nextSongID = playlist.lastSongID + 1



        // Check whether path is a folder or a file
        if (fs.lstatSync(url).isDirectory()) {
            // We will need to find EVERY file inside this directory
            let baseNode = await readDirectoryTree(url, true)
            let allFiles = generateFileListFromFileNodes(baseNode[0], [])
            // Filter out .flac/.mp3/.m4a files
            let filteredFiles = allFiles.filter(e => e.endsWith('.flac') || e.endsWith('.mp3') || e.endsWith('.m4a'))
            // Generate file array from filtered files
            let fileArray = []

            for (const url of filteredFiles) {
                let rawMetadata = await mm.parseFile(url)
                let metadata = metadataTransformer.transformMetadata(rawMetadata)
                fileArray.push({url, metadata, id: nextSongID})
                nextSongID++
            }
            
            playlist.content.push(...fileArray)
        }
        else {
            // If its a file we can just add it to the playlist
            let rawMetadata = await mm.parseFile(url)
            let metadata = metadataTransformer.transformMetadata(rawMetadata)
            playlist.content.push({url, metadata, id: nextSongID})
        }

        // Manage song IDs
        playlist.lastSongID = nextSongID

        // Update change in storage and back to renderer
        nconf.stores.app.set('app:playlists', allPlaylists)
        saveConfig()
        return allPlaylists
    })
}

const generateFileListFromFileNodes = (node, allFiles) => {
    if (node.isFolder) {
        node.content.forEach((child) => {
            generateFileListFromFileNodes(child, allFiles)
        })
    }
    else {
        allFiles.push(node.path)
    }
    return allFiles
}

const directoryCrawl = async (dir) => {
    base = []
    baseNode = new BrowserNode(dir , dir, true)

    await traverseNode(baseNode)
    base.push(baseNode)

    return base
}

const traverseNode = async (currentNode) => {
    // Read directory
    const content = await fs.promises.readdir(currentNode.path, {withFileTypes: true})
    const baseDir = currentNode.path + '\\'

    const folders = content
        .filter(item => !item.isFile())
        .map(item => new BrowserNode(item.name, baseDir + item.name, true))
    
    currentNode.content = currentNode.content.concat(folders)

    // Grab files from content and into current base
    const files = content
        .filter(item => item.isFile())
        .map(item => new BrowserNode(item.name, baseDir + item.name, false))
    
    // Add to base folder
    currentNode.content = currentNode.content.concat(files)

    for (const folder in folders) {
        currentWorking = folders[folder]
        await traverseNode(currentWorking)
    }
    // console.log(currentNode)
}

const readFilesystem = async (dir) => {
    // Async read file system
    const structure = await directoryCrawl(dir)
    // console.log(files)
    return structure
}

const initLocalStorage = async () => {
    if (!fs.existsSync(store)) {
        fs.mkdirSync(store)
    }
}

const saveConfig = () => {
    nconf.save((err) => {
        if (err) {
            console.error(err.message)
            return
        }
    })
}

const createEmptyPlaylist = (name) => {
    // Set new ID
    let newID
    let lastID = nconf.get('app:lastPlaylistID')
    if (!lastID) {
        nconf.stores.app.set('app:lastPlaylistID', 1)
        newID = 1
    }
    else {
        nconf.stores.app.set('app:lastPlaylistID', lastID + 1)
        newID = lastID + 1
    }
    
    let fullID = 'pl-' + newID
    // Create playlist
    let newPlaylist = new PlaylistComponent.Playlist(fullID, name)

    // Add to playlist config
    let playlistConfig = nconf.get('app:playlists')
    if (!playlistConfig) {
        let playlists = []
        playlists.push(newPlaylist)
        nconf.stores.app.set('app:playlists', playlists)
    }
    else {
        let playlists = nconf.get('app:playlists')
        playlists.push(newPlaylist)
        nconf.stores.app.set('app:playlists', playlists)
    }

    saveConfig()
    
    return newPlaylist 
}

const _findAlbumArt = async (path) => {
    // Finds album art in path by finding first png/jpg file
    // Get all files at path
    const content = fs.readdirSync(path);

    // console.log(content)

    // Get file ending in .jpg or .png
    let coverFile = content.find((x) => x.endsWith('.png') || x.endsWith('.jpg'))
    
    // If no cover file found, return null
    if (!coverFile) {
        return null
    }
    else {
        // Return full path
        let result = path + '\\' + coverFile
        console.log(result)
        return result
    }
}


// API: Ask Vibrant for a palette from url
const _getVibrantColors = async (url) => {
    let vibrant = new Vibrant(url)
    let result = vibrant.getPalette((err, palette) => {
        return palette
    })

    return result
}

const _lfmUpdateNowPlaying = (artist, track, album) => {
    sig = _buildLastFmSignature([
        {key: 'api_key', value: lastfmApikey},
        {key: 'artist', value: artist},
        {key: 'track', value: track},
        {key: 'album', value: album},
        {key: 'method', value: 'track.updateNowPlaying'},
        {key: 'sk', value: lastfmSessionkey}
    ])

    const scrobbleEndpoint = `http://ws.audioscrobbler.com/2.0/?method=track.updateNowPlaying&artist=${artist}&track=${track}&album=${album}&api_key=${lastfmApikey}&api_sig=${sig}&sk=${lastfmSessionkey}&api_sig=${sig}&format=json`
    axios.post(scrobbleEndpoint)
        .catch((error) => {
            if (error.response) {
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
            }
        }
    );
}

const _lfmScrobbleSong = (artist, track, album) => {
    console.log("Scrobbling song")
    const currentDateTime = new Date();
    const lfmTime = new Date(currentDateTime.getTime()); // Subtract 3 minutes in milliseconds
    const lfmTimestamp = Math.floor(lfmTime.getTime() / 1000);

    sig = _buildLastFmSignature([
        {key: 'api_key', value: lastfmApikey},
        {key: 'artist', value: artist},
        {key: 'track', value: track},
        {key: 'timestamp', value: lfmTimestamp},
        {key: 'album', value: album},
        {key: 'method', value: 'track.scrobble'},
        {key: 'sk', value: lastfmSessionkey}
    ])

    const scrobbleEndpoint = `http://ws.audioscrobbler.com/2.0/?method=track.scrobble&artist=${artist}&track=${track}&timestamp=${lfmTimestamp}&album=${album}&api_key=${lastfmApikey}&api_sig=${sig}&sk=${lastfmSessionkey}&api_sig=${sig}&format=json`
    axios.post(scrobbleEndpoint)
        .catch((error) => {
            if (error.response) {
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
            }
        }
    );
}

const _buildLastFmSignature = (params) => {
    orderedParams = params.sort((a, b) => a.key.localeCompare(b.key))
    let sharedSecret = null
    // Append secret
    try {
        const data = fs.readFileSync(lfmSharedSecretLocation, 'utf8');
        
        // Handle the data here
        if (data) {
            sharedSecret = data;
        }
    } catch (err) {
        // Handle errors here
        console.error(err);
    }

    let signature = ''
    orderedParams.forEach((param) => {
        signature += param.key + param.value
    })
    signature += sharedSecret

    const hashSig = crypto.createHash('md5').update(signature).digest('hex');
    return hashSig
}

const _getLastFmSession = async (lastfmToken) => {
    const activeSessionEndpoint = `http://www.last.fm/api/auth/?api_key=${lastfmApikey}&token=${lastfmToken}`
    open(activeSessionEndpoint)
    // Give user time to click accept 🤷🏻‍♂️
    await new Promise(resolve => setTimeout(resolve, 10000));

    // The lastfmToken is now authorized, we can request a session key
    // Build signature
    const params = [
        {key: 'api_key', value: lastfmApikey},
        {key: 'method', value: 'auth.getSession'},
        {key: 'token', value: lastfmToken}
    ]
    const signature = _buildLastFmSignature(params)
    console.log(signature)

    const getSessionKeyEndpoint = `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&token=${lastfmToken}&api_key=${lastfmApikey}&api_sig=${signature}&format=json`
    axios.get(getSessionKeyEndpoint)
        .then((response) => {
            if (response.status == 200) {
                console.log(response.data.session)
                // Save session key to file
                fs.writeFile(lfmSessionkeyLocation, response.data.session.key, (err) => {
                    console.log("Writing new session key. Scrobbling will work on next start.")
                    if (err) {
                        console.error(err)
                    }
                })
                return lfmSessionkeyLocation
            }
        }).catch((error) => {
            if (error.response) {
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
            }
        });
}

const _requestLastFmSession = async () => {
    // http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=&format=json
    const getTokenEndpoint = `http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=${lastfmApikey}&format=json`
    // Send GET request to get token
    axios.get(getTokenEndpoint)
        .then(async (response) => {
            if (response.status == 200) {
                return await _getLastFmSession(response.data.token);
            }
        }), (error) => {
            console.log(error);
        }
}

const _setupLastFm = async () => {
    // API KEY (Sync read, we need it in the next step)
    try {
        const fileContent = fs.readFileSync(lfmApikeyLocation, 'utf8')
        lastfmApikey = fileContent
    } catch (err) {
        console.log("Could not find last.fm API key file. Please create a file called scorpio_lastfm_api.txt in the root directory of the application and paste the Scorpio API key there.")
        console.error(err)
    }

    // SESSION
    try {
        if (!fs.existsSync(lfmSessionkeyLocation)) {
            // Create session token file
            fs.open(lfmSessionkeyLocation, 'w', (err, fd) => {
                if (err) {
                    throw err;
                } 
            });
        }
    } catch (err) {
        console.error(err)
    }
    
    // Read contens of lastfm_session.txt
    sesToken = null
    fs.readFile(lfmSessionkeyLocation, 'utf8', async (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        if (data) {
            lastfmSessionkey = data
        } else {
            console.log('No last.fm session token found. Request token.')
            lastfmSessionkey = await _requestLastFmSession()
        }
    });
}

const initialize = async () => {
    // IF /storage/ does not exist, create:
    initLocalStorage()

    // Create empty player context
    player = new Player(new PlayInfo(''))
    console.log(player)

    //Add configuration files to different stores
    nconf.file('app', store + localConfigFile)
    nconf.file('filetree', store + localFiletreeFile)
    nconf.file('colors', store + localColorFile)
    nconf.load()

    _setupLastFm()
}

const initRenderer = async (window) => {
    // We need a small pause to send messages to our renderer, as it needs some time to start up
    await new Promise(r => setTimeout(r, 500))
    // Example of how to send a message to client; See implementation in preload and renderer.
    await test(window)
}

// Example how to send messages to main window
const test = async (window) => {
    window.webContents.send('test-message', 'I am a payload for the renderer')
}

const _main = () => {
    // Setup some platform specific bindings
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })

    // Setup local cache, etc
    initialize()

    // Do renderer-specific actions
    app.whenReady().then(() => {
        var window = createWindow()
        initRenderer(window)
    })
}

class ColorPalette {
    constructor(highlight, darken, general, contrast) {
        this.Highlight = highlight
        this.Darken = darken
        this.General = general
        this.Contrast = contrast
    }
}


class Player {
    constructor(playing) {
        this.Playing = playing
        this.LastPlayed = new PlayInfo('')
    }
}

class PlayInfo {
    constructor(baseDir) {
        this.Basedir = baseDir
    }
}

_main()