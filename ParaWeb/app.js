const d = document
const mapFileInput = d.getElementById("mapFileInput")
const songFileInput = d.getElementById("songFileInput")
const audioPlayer = d.getElementById("audioPlayer")
const timelineContainer = d.getElementById("timelineContainer")
const timeline = d.getElementById("timeline")
const timelineCont = d.getElementById("timeline-container")
const iLabelsDiv = d.getElementById("instLabelsDiv")
const mainMenu = d.getElementById("mainMenu")
const mapEditCont = d.getElementById("mapEditorCont")
const metaMenu = d.getElementById("editMeta")
const wavesurferContainer = d.getElementById("wavesurferContainer")
const cursorBar = d.getElementById("cursorBar")
const speedSlider = d.getElementById("speedSlider")
const speedSpan = d.getElementById("speedSpan")
const pitchCheckbox = d.getElementById("pitchCheckbox")
const coverPreview = d.getElementById("coverPreview")
const newMapInput = d.getElementById("newMapFileInput")
const diffSelect = d.getElementById("diffSelect")

// Metadata inputs 
const editTitle = d.getElementById("titleInputMap")
const editDescription = d.getElementById("descriptionInputMap")
const editArtist = d.getElementById("artistInputMap")
const editAuthor = d.getElementById("authorInputMap")
const editComplexity = d.getElementById("complexityInputMap")
const editCover = d.getElementById("coverFileInput")

var zip = new JSZip() //lib  https://github.com/Stuk/jszip

let wavesurfer
let scale = 200
let cursorPos = 0
let lastTime = 0

let tracks = []
let cover = {
    url: null,
    file: null,
    new: {
        url: null,
        file: null
    }
}
let difficulties = {
    easy: JSON.parse(JSON.stringify(defaultrlrr)),
    normal: JSON.parse(JSON.stringify(defaultrlrr)),
    hard: JSON.parse(JSON.stringify(defaultrlrr)),
    expert: JSON.parse(JSON.stringify(defaultrlrr))
}
let meta = {}
let map = difficulties.expert


function fixTimelineWidth(newW) {
    newW += scale*4
    if (newW > Number(timeline.style.width.slice(0, timeline.style.width.length - 2))) {
        timeline.style.width = `${newW}px`
    }
}

function scaleUp() {
    if (map != {} && scale*2 <= 400) {
        timeline.style.width = `0px`
        scale *= 2
        timelineContainer.scrollLeft *= 2
        if (wavesurfer) {
            wavesurferContainer.style.width = `${wavesurfer.getDuration() * scale}px`
            fixTimelineWidth(wavesurfer.getDuration() * scale)
        }
        setupTimeline()
    }
}
function scaleDown() {
    if (map != {} && scale/2 >= 50) {
        timeline.style.width = `0px`
        scale /= 2
        timelineContainer.scrollLeft /= 2
        if (wavesurfer) {
            wavesurferContainer.style.width = `${wavesurfer.getDuration() * scale}px`
            fixTimelineWidth(wavesurfer.getDuration() * scale)
        }
        setupTimeline()
    }
}

function selectDiff() {
    map = difficulties[diffSelect.value]
    setupTimeline()
}

function loadSong() {
    songFileInput.click()
}

async function songFileSelected(file = null) {
    let Afile = file ? file : await songFileInput.files[0]
    if (Afile) {
        // let file = await songFileInput.files[0]
        tracks.push(Afile)
        wavesurfer = WaveSurfer.create({
            container: '#wavesurferContainer',
            waveColor: 'hsl(300, 27%, 40%)',
            progressColor: 'hsl(300, 27%, 30%)',
            url: URL.createObjectURL(Afile)
        })
        wavesurfer.on("decode", (duration) => {
            wavesurferContainer.style.width = `${duration * scale}px`
            fixTimelineWidth(duration * scale)
            wavesurfer.setVolume(0.2)
            // wavesurfer.registerPlugin(
            //     WaveSurfer.Spectrogram.create({
            //         height: 256,
            //         splitChannels: false,
            //         frequencyMax: 4800,
            //         frequencyMin: 0,
            //         fftSamples: 256,
            //         useWebWorker: true, // Use web worker for FFT calculations (improves performance)
            //     })
            // )
        })
    }
}

function importInstruments() { // TODO: Upewnić się czy można mieć eventy niezassignowane do żadnego instrumentu
    let fileInp = d.createElement("input")
    fileInp.type = "file"
    fileInp.accept = ".rlrr"
    fileInp.addEventListener("change", async () => {
        if (fileInp.files) {
            let data = await fileInp.files[0].text()
            data = data.replace(/\t/g, "    ")
            data = JSON.parse(data)
            map.instruments = data.instruments
            let classDic = {}
            for (instrument of map.instruments) {
                if (instrument.class in classDic) {
                    classDic[instrument.class] += 1
                } else {
                    classDic[instrument.class] = 1
                }
                if (instrument.name.split("_").pop().startsWith("2147")) {
                    let newName = instrument.name.split("_")
                    newName.splice(-1, 1, classDic[instrument.class].toString())
                    newName = newName.join("_")
                    instrument.name = newName
                }
                const allowedProperties = ["name", "class", "location", "rotation", "scale", "volumeMultiplier", "pitchMultiplier"] // TODO: Upewnić się czy to wszystkie potrzebne propertiesy
                for (p of Object.keys(instrument)) {
                    if (!(allowedProperties.includes(p))) {
                        delete instrument[p]
                    }
                }
            }
            setupTimeline()
        }
    })
    fileInp.click()
}

function speedChanged() {
    if (wavesurfer) {
        wavesurfer.setPlaybackRate(speedSlider.valueAsNumber, pitchCheckbox.checked)
        speedSpan.innerHTML = speedSlider.value + "x"
    }
}

d.addEventListener("keydown", (e) => {
    if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA") return
    switch (e.code) {
        case "Space":
            e.preventDefault()
            if (wavesurfer) {
                wavesurfer.playPause()
            }
            break;
    }
})

d.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "AltLeft":
        case "AltRight":
            e.preventDefault()
            break;
        case "Escape":
            if (metaMenu.style.display == 'flex') { //meta menu is open
                e.preventDefault()
                if (cover.new.url) { //clear temp
                    coverPreview.src = cover.url ? cover.url : ""
                    URL.revokeObjectURL(cover.new.url)
                    editCover.value = null
                    cover.new.url = null
                } 
                if (cover.new.file) { //clear temp
                    cover.new.file = null
                }
                metaMenu.style.display='none'
                if (metaMenu.dataset['mode'] == 'new') mainMenu.style.display='flex'
                metaMenu.dataset['mode'] = null
                editMeta(false)
            }
            break;
    }
})


// ### METADATA EDITING ###

function metaSave() {
    if (cover.new.url) {
        URL.revokeObjectURL(cover.url) //clear temp
        cover.url = cover.new.url
        cover.new.url = null
    }
    if (cover.new.file) {
        cover.file = cover.new.file
        cover.new.file = null //clear temp
    }
    metaMenu.dataset['mode'] == 'new' ? finalizeNewMap() : editMeta()
    metaMenu.style.display='none'
    metaMenu.dataset['mode'] = null
}

function editMetaMenu() {
    newMapMenu.style.display = "block"
}

function editMeta(toFile = true) {
    if (toFile) { // from form to file
        meta.title = editTitle.value
        meta.description = editDescription.value
        meta.artist = editArtist.value
        meta.creator = editAuthor.value
        meta.complexity = Number(editComplexity.value)
    } else { // from file to form
        editTitle.value = meta.title
        editDescription.value = meta.description
        editArtist.value = meta.artist
        editAuthor.value = meta.creator
        editComplexity.value = meta.complexity
    }
}

async function coverFileSelected() {
    if (!editCover.files) return
    let file = await editCover.files[0]
    let url = URL.createObjectURL(file)
    file.name = "cover.png"
    d.getElementById("coverPreview").src = url
    cover.new.file = file //to temp
    cover.new.url = url
}

editTitle.addEventListener("input", () => {
    if (editArtist.value && editTitle.value) {
        d.getElementById("saveMetaButt").classList = "accButton"
    } else {
        d.getElementById("saveMetaButt").classList = "disabledButton"
    }
})

editArtist.addEventListener("input", () => {
    if (editArtist.value && editTitle.value) {
        d.getElementById("saveMetaButt").classList = "accButton"
    } else {
        d.getElementById("saveMetaButt").classList = "disabledButton"
    }
})

// ### MAP CREATION ###

function finalizeNewMap() {
    mapEditCont.style.display = "block"
    editMeta()
    addInstruments()
    placeBars()
}

function newMap() {
    metaMenu.style.display='flex'
    metaMenu.dataset["mode"]="new"
    mainMenu.style.display='none'
}


// ### MAP SAVING ###

async function downloadZip() {
    let zipFolder = zip.folder(map.recordingMetadata.title)
    for ([diff, data] of Object.entries(difficulties)) {
        if (data.events.length > 0) {    
            let diffName = diff.charAt(0).toUpperCase() + diff.slice(1)
            data.recordingMetadata = meta
            zipFolder.file(`${meta.title}_${diffName}.rlrr`, JSON.stringify(data, null, "    "))
        }
    }
    map.audioFileData.songTracks = [] // dodawac pozniej
    map.audioFileData.drumTracks = []
    map.audioFileData.songPreview = ""
    if (cover) {
        zipFolder.file('cover.png', cover.file)
    }
    if (tracks) {
        for (let file of tracks) {
            map.audioFileData.songTracks.push(file.name) 
            zipFolder.file(file.name, file)
        }
    }
    await zip.generateAsync({type:"blob"}).then(function (cont) {
        const url = URL.createObjectURL(cont)
        const a = document.createElement("a")
        a.href = url
        a.download = meta.title
        a.click()
        URL.revokeObjectURL(url)
    });
}

async function saveMap() {
    if (wavesurfer) {
        map.recordingMetadata["length"] = wavesurfer.getDuration()
    }
    if (cover.file) {
        map.recordingMetadata.coverImagePath = "cover.png"
    }
    await downloadZip()
    // let a = d.createElement('a')
    // let file = new Blob([ JSON.stringify(map, null, "    ") ])
    // a.href = URL.createObjectURL(file)
    // a.download = map.recordingMetadata.title + "_Expert.rlrr"
    // a.click()
}

// ### MAP LOADING ###

async function loadRLRR(file) {
    let Afile = await file.text()
    let mapTemp = null
    try {
        mapTemp = JSON.parse(Afile.replace(/\t/g, "    "))
    } catch (err) {
        console.log(err)
        alert("Map file is broken...")
    }
    if (mapTemp) map = mapTemp
    editMeta(false)
    setupTimeline()
}

async function mapFileSelected() {
    if (mapFileInput.files) {
        if (mapFileInput.files[0].name.endsWith(".zip")) {
            let z = await JSZip.loadAsync(await mapFileInput.files[0].arrayBuffer())
            let mapFiles = []
            z.forEach((relativePath, zipEntry) => {
                // console.log(zipEntry)
                if (zipEntry.name.endsWith(".rlrr")) {
                    let diff = zipEntry.name.slice(0, -5).split("_").pop()
                    mapFiles.push([diff.toLowerCase(), zipEntry])
                } else if (zipEntry.name.endsWith(".png") || zipEntry.name.endsWith(".jpg")) {
                    zipEntry.async("blob").then((b) => {
                        let url = URL.createObjectURL(b)
                        cover.url = url
                        cover.file = new File([b], "cover.png", {type: b.type})
                        coverPreview.src = url
                    })
                } else if (zipEntry.name.endsWith(".ogg") || zipEntry.name.endsWith(".wav") || zipEntry.name.endsWith(".flac")) {
                    zipEntry.async("blob").then(async (b) => {
                        let fileName = zipEntry.name.split('/')
                        fileName = fileName[fileName.length-1]
                        let file = new File([b], fileName, {type: b.type})
                        await songFileSelected(file)
                    })
                }
            })
            for (element of mapFiles) {
                const diff = element[0]
                const data = element[1]
                let file = await data.async("string")
                let mapTemp = null
                try {
                    mapTemp = JSON.parse(file.replace(/\t/g, "    "))
                } catch (err) {
                    console.log(err)
                    alert(diff + " map file is broken...")
                }
                if (mapTemp) difficulties[diff] = JSON.parse(JSON.stringify(mapTemp))
                meta = mapTemp.recordingMetadata
            }
                
            mainMenu.style.display = "none"
            mapEditCont.style.display = "block"
            editMeta(false)
            selectDiff() // nie selectuje diff, ale naprawiło wszystko!
            return
        }
        if (mapFileInput.files[0].name.endsWith(".rlrr")) {
            await loadRLRR(mapFileInput.files[0])
            mainMenu.style.display = "none"
            mapEditCont.style.display = "block"
            return
        }
    }
}

function setupTimeline() {
    lastTime = 0
    addInstruments()
    for (e of map.events) {
        try {
            addEventDiv(Number(e.time), e.name)
        } catch(err) {
            console.warn("Error displaying event.")
        }
    }
    placeBars()
}

function addInstruments() {
    iLabelsDiv.innerHTML = ""
    for (el of d.querySelectorAll('#timeline > div')) {
        el.remove()
    }
    for (i of map.instruments) {
        let iDiv = d.createElement("div")
        iDiv.className = `instrumentLine ${i.class}`
        iDiv.id = i.name
        iDiv.addEventListener("click", (e) => {
            if (e.button == 0 && !e.altKey) {
                let time = cursorPos / scale
                if (time != 0) {    
                    map.events.push(new PDEvent(time, e.target.id))
                    addEventDiv(time, e.target.id)
                }
            }
        })
        let label = d.createElement("div")
        label.innerText = i.name
        label.className = `instrumentLabel ${i.class}`
        iLabelsDiv.appendChild(label)
        timeline.appendChild(iDiv)
    }
}

function placeBars() {
    for (el of d.querySelectorAll('#timeline > .bar')) {
        el.remove()
    }

    map.bpmEvents.sort((a, b) => a.time - b.time)
    // console.log(map.bpmEvents)

    for (let idx = 0; idx < map.bpmEvents.length; idx++) {
        let be = map.bpmEvents[idx]
        let inter = 60 / be.bpm

        let stop = (lastTime - be.time) / inter + 4
        // console.log(lastTime)
        if (stop < 0) stop = 4

        if (idx != map.bpmEvents.length - 1) {
            stop = (map.bpmEvents[idx + 1].time - be.time) / inter
            // console.log(stop)
        }
        for (let i = 0; i < stop; i++) {
            let bar = d.createElement("div")
            bar.className = "bar"
            bar.style.left = `${(be.time + (inter * i)) * scale}px`
            if (i % 4 == 0) {
                bar.style.backgroundColor = i == 0 ? "#d94141" : "var(--bg-lll)"
                if (i == 0) {
                    let p = d.createElement("p")
                    p.className = "bpm"
                    p.innerText = be.bpm
                    bar.appendChild(p)
                }
            }
            timeline.appendChild(bar)
        }
    }
}

class PDEvent {
    constructor(time, iName, vel = 96, loc = 0) {
        this.time = time
        this.name = iName
        this.vel = vel
        this.loc = loc
    }
}

function addEventDiv(time, iName) {
    let eDiv = d.createElement("div")
    eDiv.className = `event`
    eDiv.dataset["time"] = time
    eDiv.style.left = `${time * scale}px`
    if (!(iName.includes("Hat") || iName.includes("Crash") || iName.includes("Ride"))) {
        eDiv.style.borderRadius = "0"
        eDiv.style.width = "8px"
        eDiv.style.margin = "auto -4px"
    }
    eDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault()
        deleteEvent(e.target.dataset.time, e.target.parentElement.id)
        e.target.remove()
    })
    fixTimelineWidth(time * scale)
    lastTime = Math.max(time, lastTime)
    d.getElementById(iName).appendChild(eDiv)
    return eDiv
}

function deleteEvent(time, iName) {
    for (let i = 0; i < map.events.length; i++) {
        let e = map.events[i]
        if (e.time == time && e.name == iName) {
            map.events.splice(i, 1)
            i--
        }
    }
}

function getSnappedPos(px, c = 4) {
    let be = getNearestBpmChange(px)
    let inter = (60 / be.bpm / c) * scale
    let ox = px - (be.time * scale)
    return be.time * scale + Math.round(ox / inter) * inter
}

function getNearestBpmChange(px) {
    if (map.bpmEvents.length == 1) {
        return map.bpmEvents[0]
    }
    let i
    for (i = 0; i < map.bpmEvents.length; i++) {
        let be = map.bpmEvents[i]
        if (be.time * scale > px) {
            return map.bpmEvents[i-1]
        }
    }
    return map.bpmEvents[i-1]
}

timeline.addEventListener("mousemove", (e) => {
    let c = 4
    if (e.shiftKey) c *= 4
    if (e.ctrlKey) c *= 3
    cursorPos = getSnappedPos(e.offsetX, c)
    cursorBar.style.left = `${cursorPos}px`
})

class BpmEvent {
    constructor(time, bpm) {
        this.bpm = bpm
        this.time = time
    }
}

timeline.addEventListener("click", (e) => {
    if (e.altKey) {
        let near = getNearestBpmChange(cursorPos + 0.1)
        let nbpm = Number(prompt("Enter new BPM (0 to remove):", near.bpm))
        if (Math.abs(near.time - cursorPos / scale) < 0.1) {
            if (nbpm == 0) {
                map.bpmEvents.splice(map.bpmEvents.indexOf(near), 1)
            } else if (!nbpm) {
                return
            } else {
                near.bpm = nbpm
            }
        } else if (nbpm) {
            map.bpmEvents.push(new BpmEvent(cursorPos / scale, nbpm))
        }
        placeBars()
    }
})

editMeta(false) //clear meta fields 