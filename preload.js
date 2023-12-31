const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld('electronAPI', {
    // Invokes (Renderer --> Main)
    handleDirectoryBase: (dir) => ipcRenderer.invoke('handle:scanDirectory', dir),
    handleGetMetadata: (url) => ipcRenderer.invoke('handle:getMetadata', url),
    handlePlaySong: (url) => ipcRenderer.invoke('handle:playSong', url),
    handleNewPlaylist: () => ipcRenderer.invoke('handle:addPlaylist'),
    handleDeletePlaylist: (pl) => ipcRenderer.invoke('handle:deletePlaylist', pl),
    handleRetrievePlaylists: () => ipcRenderer.invoke('handle:getPlaylists'),
    handleAddPathToPlaylist: (pl, path) => ipcRenderer.invoke('handle:addPathToPlaylist', pl, path),
    handlePlaylistUpdate: (playlist) => ipcRenderer.invoke('handle:playlistUpdate', playlist),
    handlePlaylistFinished: () => ipcRenderer.invoke('handle:playlistFinished'),
    handlePaletteSave: (palette) => ipcRenderer.invoke('handle:savePalette', palette),
    handleSongFinished: () => ipcRenderer.invoke('handle:songFinished'),

    // On (Main --> Renderer)
    onTestMessage: (msg) => ipcRenderer.on('test-message', msg),
    onSongMetadata: (metadata) => ipcRenderer.on('song-metadata', metadata),
    onAlbumArt: (albumArt) => ipcRenderer.on('album-art', albumArt),
    onPalette: (palette) => ipcRenderer.on('color-palette', palette)
})

window.addEventListener('DOMContentLoaded', () => {
    bindMenubarButtons()
    // setResizableElements()
})

// TODO: turn these into IPC bindings (renderer <--> client)
const bindMenubarButtons = () => {
    document.getElementById("minimize-button").addEventListener("click", (e) => {
        ipcRenderer.send("minimize")
    })

    document.getElementById("maximize-button").addEventListener("click", (e) => {
        ipcRenderer.send("maximize")
    })

    document.getElementById("close-button").addEventListener("click", (e) => {
        ipcRenderer.send("close")
    })
}

/* const setResizableElements = () => {
    var fileBrowser = document.getElementById('file-browser');
    var resizer = document.createElement('div');
    resizer.className = 'resizer';
    fileBrowser.appendChild(resizer);
    resizer.addEventListener('mousedown', initResize, false);

    function initResize(e) {
    window.addEventListener('mousemove', Resize, false);
    window.addEventListener('mouseup', stopResize, false);
    }
    function Resize(e) {
    fileBrowser.style.width = (e.clientX - fileBrowser.offsetLeft) + 'px';
    }
    function stopResize(e) {
        window.removeEventListener('mousemove', Resize, false);
        window.removeEventListener('mouseup', stopResize, false);
    }
} */