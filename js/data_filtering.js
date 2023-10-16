let MAP_WIDTH = 500
let MAP_HEIGHT = 300


let inputs = d3.selectAll('input')['_groups'][0]
let inputsList = []
inputs.forEach(d => {
    inputsList.push(d.value)
})

console.log(inputsList)


function update(selectedBrands) {
    console.log(selectedBrands)
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

        const fuel = $('#fuel-type').val()
        const fuelFilData = dataFilMenu(fuel, 2, carsMapData)
        const groupedData = d3.group(fuelFilData, d => d[5])

        removeHexGraph()
        addHexGraph(groupedData)
        removePie()
        addPie(groupedData)

    })
}

function hideLoadingIndicator() {
    console.log('hide load')
    document.getElementById('load-wrapp').classList.add('hidden');
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
    const randomFillPaths = document.querySelectorAll('.random-fill');
    randomFillPaths.forEach(path => {
        const randomColor = getRandomColor();
        path.style.fill = randomColor;
    })
    document.getElementById('load-wrapp').classList.remove('hidden');
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

