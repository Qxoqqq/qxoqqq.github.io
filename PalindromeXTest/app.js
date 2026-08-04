const d = document
const calendarContainer = d.querySelector(".calendarContainer")
const calendar = d.querySelector(".calendar")
const hoursColumn = d.querySelector("div.hoursColumn")
const daysRow = d.querySelector("div.daysRow")
const dayColumns = d.querySelector("div.dayColumns")
const monthsRow = d.querySelector("div.monthsRow")
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const infoPopup = d.getElementById("infoPopup")
let calendarStartDate = new Date(2026, 7, 1)
let taskStacks = {}
let taskCounter = 1

addBox("\xa0", "hour")
addBox("\xa0", "hour")
addBox("\xa0", "hour")

for (let h = 11; h > 0; h--) {
    addBox(h, "hour")
}

for (let m = 7; m <= 8; m++) {
    addBox(m, "month")
    for (let dy = 1; dy <= daysInMonth(m); dy++) {
        let el = addBox(dy, "day")
        let col = d.createElement("div")
        col.id = `d${dy}m${m}`
        col.classList.add("dayColumn")
        col.oncontextmenu = (e) => {
            e.preventDefault()
            tasks.push(new Task(new Date(2026, m, dy)))
            draw()
        }
        dayColumns.appendChild(col)

        if (isWeekend(dy, m)) {
            el.classList.add("weekend")
            col.classList.add("weekend")
        }
    }
}

d.addEventListener("DOMContentLoaded", (e) => {
    d.querySelector(".dateContainer").style.minWidth = d.querySelector(".daysRow").clientWidth + "px"
    calendar.style.minWidth = d.querySelector(".daysRow").clientWidth + "px"

    let scrollbarWidth = calendarContainer.offsetHeight - calendarContainer.clientHeight
    d.querySelector(":root").style.setProperty("--scroll-width", scrollbarWidth + "px")
    draw()
})

function dateDifference(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let timeDifference = end - start;
    let res = timeDifference / (1000 * 3600 * 24);
    return res;
}

function daysInMonth (month) {
    return new Date(2026, month, 0).getDate()
}

function isWeekend (day, month) {
    let d = new Date(2026, month, day).getDay()
    if(d == 6 || d == 0) return true
    return false
}

function addBox(n, type) {
    let el = d.createElement("div")
    el.classList.add("box")
    if (n) el.innerText = n
    switch (type) {
        case "hour":
            el.id = "h" + n
            hoursColumn.appendChild(el)
            break;
        case "day":
            el.id = "d" + n
            daysRow.appendChild(el)
            break;
        case "month":
            el.innerText = MONTHS[n]
            el.classList.add("month")
            el.id = "m" + n
            el.style.minWidth = daysInMonth(n) * 12 + "vh"
            monthsRow.appendChild(el)
            break;
    }
    return el
}

window.addEventListener("resize", (e) => {
    draw()
})

// CANVAS SHENANIGANS

const c = d.getElementById("canvas")
c.width = c.clientWidth
c.height = c.clientHeight
const ctx = c.getContext("2d")

let tasks = []

class Task {
    constructor(startDate, dayCount = 1) {
        this.startDate = startDate
        this.dayCount = dayCount   
        this.name = `Task ${taskCounter}`
        taskCounter++
        this.color = randomHex()
        this.hours = 1
    }

    get endDate() {
        let date = new Date(this.startDate)
        let totalDuration = this.dayCount
        for (let i = 0; i < totalDuration; i++) {
            if (isWeekend(date.getDate(), date.getMonth())) totalDuration++
            date.setDate(date.getDate() + 1)
        }
        
        return date
    }
}

tasks.push(new Task(new Date(2026, 8, 1), 3))

function onMouseMove(e) {
    const task = tasks[hoveredIndex]
    let mx = e.x - calendar.getBoundingClientRect().x
    let my = e.y - calendar.getBoundingClientRect().y
    if (grabbedTask) {
        infoPopup.style.visibility = "hidden"
        let newDate = positionToDate(mx)
        if (hoveredEdge == 0 || hoveredEdge == -1) {
            newDate.setDate(newDate.getDate() - hoveredDay)
            while (isWeekend(newDate.getDate(), newDate.getMonth())) {
                newDate.setDate(newDate.getDate() + 1)
            }
            let weekendCount = 0
            let weekendDate = new Date(newDate)
            while (weekendDate.getTime() < task.endDate.getTime()) {
                if (isWeekend(weekendDate.getDate(), weekendDate.getMonth())) weekendCount++
                weekendDate.setDate(weekendDate.getDate() + 1)
            }
            if (task.startDate != newDate) {
                let daysDiff = dateDifference(newDate, task.endDate) - weekendCount
                if (hoveredEdge == -1) {
                    if (daysDiff > 0) {
                        task.dayCount = daysDiff
                        task.startDate = newDate
                    }
                } else {
                    task.startDate = newDate
                }
                draw()
            }
        }
        if (hoveredEdge == 1 || hoveredEdge == 2) {
            let weekend = false
            while (isWeekend(newDate.getDate(), newDate.getMonth())) {
                newDate.setDate(newDate.getDate() - 1)
            }

            for (let i = 0; i < 2; i++) { // Hmm, how do I fix a bug visible for only one frame? Just run it twice before drawing lol
                if (i == 0 || task.dayCount + dateDifference(task.endDate, newDate) + 1 > 0) {
                    task.dayCount += dateDifference(task.endDate, newDate) + 1
                }
            }
            draw()
        }
    } else {
        let prevHovered = hoveredTask
        let prevEdge = hoveredEdge
        const [name, hours, day, idx, edge] = checkHover(mx, my)
        hoveredTask = name
        hoveredDay = day
        hoveredIndex = idx
        hoveredEdge = edge
        if (hoveredTask != prevHovered || hoveredEdge != prevEdge) draw()
        
        infoPopup.style.visibility = hoveredTask ? "visible" : "hidden"
        infoPopup.style.left = e.x + "px"
        infoPopup.style.bottom = window.visualViewport.height - e.y + "px"

        let task = tasks[hoveredIndex]
        if (task) {
            infoPopup.innerText = `${task.name}\nDates: ${task.startDate.toISOString().split('T')[0]} → ${task.endDate.toISOString().split('T')[0]}\nWork days: ${task.dayCount}\nHours: ${task.hours}`
        }
    }
}

calendar.addEventListener("mousemove", onMouseMove)

calendar.addEventListener("mousedown", (e) => {
    if (e.button == 0 && hoveredTask) {
        grabbedTask = hoveredTask
        onMouseMove(e)
        draw()
    }
})

calendar.addEventListener("wheel", (e) => {
    let dir = -e.deltaY / Math.abs(e.deltaY)
    if (grabbedTask) {
        if (dir > 0) {
            if (hoveredIndex < tasks.length - 1) {
                [tasks[hoveredIndex], tasks[hoveredIndex+1]] = [tasks[hoveredIndex+1], tasks[hoveredIndex]];
                hoveredIndex += 1
            }
        } else {
            if (hoveredIndex > 0) {
                [tasks[hoveredIndex], tasks[hoveredIndex-1]] = [tasks[hoveredIndex-1], tasks[hoveredIndex]]; 
                hoveredIndex -= 1
            }
        }
        draw()
    } else if (hoveredTask) {
        tasks[hoveredIndex].hours += dir
        tasks[hoveredIndex].hours = Math.max(tasks[hoveredIndex].hours, 1)
        draw()
        let task = tasks[hoveredIndex]
        if (task) {
            infoPopup.innerText = `${task.name}\nDates: ${task.startDate.toISOString().split('T')[0]} → ${task.endDate.toISOString().split('T')[0]}\nWork days: ${task.dayCount}\nHours: ${task.hours}`
        }
    }
})

calendar.addEventListener("mouseup", (e) => {
    if (e.button == 0) {
        grabbedTask = null
        onMouseMove(e)
        draw()
    }
})

function randomHex() {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`
}

function dateToPosition(dy, m) {
    return d.getElementById(`d${dy}m${m}`).getBoundingClientRect().x - calendar.getBoundingClientRect().x
}

function positionToDate(x) {
    const dayWidth = d.querySelector(".dayColumn").getBoundingClientRect().width
    var res = new Date(calendarStartDate)
    res.setDate(res.getDate() + Math.floor(x / dayWidth))
    return res
}

let hoveredTask = null
let hoveredIndex = null
let hoveredDay = 0
let hoveredEdge = 0 // -1 - left, 0 - center, 1 - right, 2 - top
let grabbedTask = null

function checkHover(mx, my) {
    const hourHeight = d.querySelector(".hoursColumn > .box").getBoundingClientRect().height
    const dayWidth = d.querySelector(".dayColumn").getBoundingClientRect().width
    let date = positionToDate(mx)
    let dy = date.getDate()
    let m = date.getMonth()
    let dateId = `d${dy}m${m}`
    if (dateId in taskStacks) {
        let total = 0
        for (arr of taskStacks[dateId]) {
            let arrCpy = [...arr]
            const [name, hours, day, idx] = arrCpy
            total += hours
            if (total * hourHeight > c.clientHeight - my) {
                let edge = 0
                if (day == 0 && Math.abs(mx - dateToPosition(dy, m)) < 4) edge = -1
                if (day == tasks[idx].dayCount-1 && Math.abs(mx - (dateToPosition(tasks[idx].endDate.getDate(), tasks[idx].endDate.getMonth()))) < 4) edge = 1
                arrCpy.push(edge)
                return arrCpy
            }
        }
    }
    return [null, null, null, null, null]
}

function sortTasks() {
    tasks.sort((a, b) => b.hours / b.dayCount - a.hours / a.dayCount)
}

function draw() {
    //sortTasks()
    ctx.clearRect(0, 0, c.width, c.height)
    c.width = c.clientWidth
    c.height = c.clientHeight
    const hourHeight = d.querySelector(".hoursColumn > .box").getBoundingClientRect().height
    const dayWidth = d.querySelector(".dayColumn").getBoundingClientRect().width
    
    let stacks = {}
    taskStacks = {}
    ctx.strokeStyle = "orange"
    ctx.lineWidth = 2
    strokeArr = []
    for (task of tasks) {
        let startPos = dateToPosition(task.startDate.getDate(), task.startDate.getMonth())
        // let endPos = dateToPosition(task.endDate.getDate(), task.endDate.getMonth()) + dayWidth
        
        let totalDuration = task.dayCount
        let prevX = 0
        let prevY = 0
        for (let i = 0; i < totalDuration; i++) {
            let wDate = new Date(task.startDate)
            ctx.fillStyle = task.color
            wDate.setDate(wDate.getDate() + i)
            let dy = wDate.getDate()
            let m = wDate.getMonth()
            if (isWeekend(dy, m)) {
                totalDuration++
                continue
            }
            let off = (`d${dy}m${m}` in stacks) ? stacks[`d${dy}m${m}`] : 0
            let rx = startPos + i*dayWidth - 0.5
            let ry = c.height - (task.hours/task.dayCount) * hourHeight - off*hourHeight - 0.5
            let rw = dayWidth
            let rh = (task.hours/task.dayCount) * hourHeight + 0.5
            if (grabbedTask != task.name) {
                ctx.fillRect(rx, ry, rw, rh)
                if (prevY != ry || Math.abs(prevX - rx) > dayWidth + 1) {
                    ctx.fillStyle = "white"
                    ctx.fillText(task.name, rx + 4, ry + 12)
                    
                }
            } 
            if (hoveredTask == task.name) {
                if (prevY != ry || Math.abs(prevX - rx) > dayWidth + 1) {
                        strokeArr.push({instruction: "lineTo", x:0, y:rh})
                        strokeArr.push({instruction: "closePath"})
                        strokeArr.push({instruction: "beginPath"})
                        strokeArr.push({instruction: "moveTo", x:rx, y:ry+rh})
                        strokeArr.push({instruction: "lineTo", x:0, y:-rh})
                }
                strokeArr.push({instruction: "lineTo", x:rw, y:0})
                
                ctx.setLineDash([])
                switch (hoveredEdge) {
                    case -1:
                        if (i == 0) {
                            ctx.beginPath()
                            ctx.moveTo(rx, ry)
                            ctx.lineTo(rx, ry+rh)
                            ctx.stroke()
                        }
                        break
                    case 1:
                        if (i == totalDuration-1) {
                            ctx.beginPath()
                            ctx.moveTo(rx+rw, ry)
                            ctx.lineTo(rx+rw, ry+rh)
                            ctx.stroke()
                        }
                        break
                    default:
                        break
                }
                // ctx.setLineDash([5, 5])
                // ctx.strokeRect(rx, ry, rw, rh)
            }

            let taskData = [task.name, task.hours / task.dayCount, i - (totalDuration - task.dayCount), tasks.indexOf(task)]
            if (`d${dy}m${m}` in stacks) {
                stacks[`d${dy}m${m}`] += task.hours / task.dayCount
                taskStacks[`d${dy}m${m}`].push(taskData)
            } else {
                stacks[`d${dy}m${m}`] = task.hours / task.dayCount
                taskStacks[`d${dy}m${m}`] = [taskData]
            }

            prevX = rx
            prevY = ry
        }
    }

    if (hoveredTask) drawHovered(strokeArr)
}

let strokeArr = []

function drawHovered(strokeArr) {
    let penX = 0
    let penY = 0
    let rh = 0
    ctx.setLineDash([5, 5])
    strokeArr.shift(); strokeArr.shift()
    for (o of strokeArr) {
        switch(o.instruction) {
            case "beginPath":
                ctx.beginPath()
                break
            case "closePath":
                ctx.closePath()
                ctx.stroke()
                break
            case "moveTo":
                penX = o.x
                penY = o.y
                ctx.moveTo(penX, penY)
                break
            case "lineTo":
                if (o.y) rh = o.y
                penX += o.x
                penY += o.y
                ctx.lineTo(penX, penY)
                break
        }
    }
    ctx.lineTo(penX, penY - rh)
    ctx.closePath()
    ctx.stroke()
}