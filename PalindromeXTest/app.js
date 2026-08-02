const d = document
const calendarContainer = d.querySelector(".calendarContainer")
const hoursColumn = d.querySelector("div.hoursColumn")
const daysRow = d.querySelector("div.daysRow")
const monthsRow = d.querySelector("div.monthsRow")
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function daysInMonth (month) {
    return new Date(2026, month, 0).getDate()
}

function isWeekend (month, day) {
    let d = new Date(2026, month, day-3).getDay()
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
            el.innerText = MONTHS[n-1]
            el.id = "m" + n
            el.style.minWidth = daysInMonth(n) * 12 + "vh"
            monthsRow.appendChild(el)
            break;
    }
    return el
}

addBox("\xa0", "hour")
addBox("\xa0", "hour")
addBox("\xa0", "hour")

for (let h = 11; h > 0; h--) {
    addBox(h, "hour")
}

for (let m = 8; m <= 9; m++) {
    addBox(m, "month")
    for (let d = 1; d <= daysInMonth(m); d++) {
        let el = addBox(d, "day")
        if (isWeekend(m, d)) {
            el.classList.add("weekend")
        }
    }
}

d.addEventListener("DOMContentLoaded", (e) => {
    d.querySelector(".dateContainer").style.minWidth = d.querySelector(".daysRow").clientWidth + "px"

    let scrollbarWidth = calendarContainer.offsetHeight - calendarContainer.clientHeight
    hoursColumn.style.bottom = scrollbarWidth + "px"
})  