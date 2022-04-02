// Gets a full metadata object (from music-metadata) and extracts useful information into a metadata object

const transformMetadata = (metadata) => {
    return new MetadataClean(metadata)
}

class MetadataClean {
    constructor (metadata) {
        this.codec = metadata.format.codec
        this.bitsPerSample = metadata.format.bitsPerSample
        this.sampleRate = metadata.format.sampleRate
        this.duration = metadata.format.duration
        this.track = metadata.common.track
        this.disk = metadata.common.disk
        this.title = metadata.common.title
        this.artist = metadata.common.artist
        this.year = metadata.common.year
        this.album = metadata.common.album
    }
}

exports.transformMetadata = transformMetadata