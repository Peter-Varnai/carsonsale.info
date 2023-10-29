let MAP_WIDTH = 500
let MAP_HEIGHT = 300


let inputs = d3.selectAll('input')['_groups'][0]
let inputsList = []
inputs.forEach(d => {
    inputsList.push(d.value)
})


function update(selectedBrands) {
    const url = `https://carsonsale-api.vercel.app/${selectedBrands}`
    // const url = `http://127.0.0.1:8000/${selectedBrands}`

    const promises = [
        d3.json(url),
        d3.json("data/concentrated europe map.json")
    ]
    showLoadingIndicator()

    Promise.all(promises).then(function (data) {
        carsMapData = data[0]['data']
        activeCC = data[0]['cc']
        removeMap()
        mapData = data[1]
        drawMap(activeCC)
        hideLoadingIndicator()
        if (!localStorage.getItem("aboutPopupShown")) {
            toggleAboutPopup()
            localStorage.setItem("aboutPopupShown", "true")

        }

        const fuel = $('#fuel-type').val()
        const fuelFilData = dataFilMenu(fuel, 2, carsMapData)
        const n = carsMapData.length
        const groupedData = d3.group(carsMapData, d => d[5])

        removeHexGraph()
        addHexGraph(groupedData)
        removePie()
        addPie(groupedData)
        dataDesc(n)
    })
}


function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function showLoadingIndicator() {
    document.getElementById('filterMenu').classList.add('hidden')
    document.getElementById('pie-chart-area').style.display = "none"
    const randomFillPaths = document.querySelectorAll('.random-fill')
    randomFillPaths.forEach(path => {
        const randomColor = getRandomColor()
        path.style.fill = randomColor
    })
    document.getElementById('load-wrapp').classList.remove('hidden')
}

function hideLoadingIndicator() {
    document.getElementById('load-wrapp').classList.add('hidden')
    document.getElementById('filterMenu').classList.remove('hidden')
    document.getElementById('pie-chart-area').style.display = "flex"
}

function dataFilMenu(mValue, filterCol, data) {
    if (mValue === "All") {
        return data
    } else {
        return data.filter(d => {
            return d[filterCol] === mValue
        })
    }
}

