module.exports = class BrowserNode {
    constructor (name, path, isFolder, content = []) {
        this.name = name
        this.path = path
        this.isFolder = isFolder
        this.content = content
    }
}