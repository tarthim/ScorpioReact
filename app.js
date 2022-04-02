const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const BrowserNode = require('./shared/classes/browserNode.js')
const PlaylistComponent = require('./shared/classes/playlistComponents.js')
const mm = require('music-metadata')
const nconf = require('nconf')
const metadataTransformer = require('./shared/helpers/extractMetadata.js')
const Vibrant = require('node-vibrant')

const store = './storage/'
const localConfigFile = 'scorpio.json'
const localFiletreeFile = 'filetree.json'
const localColorFile = 'colors.json'

let player = null

async function readDirectoryTree(dir) {
    console.log('Reading directory ' + dir)
    // First check if there is a tree to pass back in our cache

    // Forced refresh seems to be a little glitched
    // Make sure that there is no data leak into colors.json, please
    let forceRefresh = false;

    let tree = nconf.stores.filetree.get(dir)
    
    if (tree && !forceRefresh) {
        console.log('Returning cached file tree')
        return tree
    }
    else {
        // Await fs information here, pass back to preload.js handler
        let fileTree = await readFilesystem(dir)
        nconf.stores.filetree.set(dir, fileTree)
        saveConfig()

        return fileTree
    }
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1450,
        height: 1000,
        frame: false,
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
        return await readDirectoryTree(p)
    })

    ipcMain.handle('handle:getMetadata', async (e, url) => {
        let metadata = await mm.parseFile(url)
        return metadataTransformer.transformMetadata(metadata)
    })

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

        console.log(player)

        // Actions to do when basepath is different:
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
    
                    console.log('Bug debugger:')
                    console.log(player)
                    
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
    // Finds album art in path
    // TODO: Implement fallback on web?

    let possibleNames = ['cover.jpg', 'front.jpg', 'folder.jpg']
    let albumArtLocation

    for (let i = 0; i < possibleNames.length; i++) {
        let fullPath = path + possibleNames[i];
        let fileAtPath = await fs.promises.access(fullPath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)

        if (fileAtPath) {
            albumArtLocation = fullPath
            break
        }
    }

    return albumArtLocation
}


// API: Ask Vibrant for a palette from url
const _getVibrantColors = async (url) => {
    // let palette = Vibrant.from(url).maxColorCount(128).getPalette()
    // .then((palette) => {
    //     console.log(palette)
    //     return palette
    // })
    // return palette

    let vibrant = new Vibrant(url)
    let result = vibrant.getPalette((err, palette) => {
        return palette
    })

    return result
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