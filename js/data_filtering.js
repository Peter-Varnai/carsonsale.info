// jQUERY ELEMENTS


$('#fuel-type')
    .on('change', () =>
        update())


$('#price-slider').slider({
    range: true,
    max: 900000,
    min: 0,
    step: 100,
    values: [0, 600000],
    slide: (event, ui) => {
        $('#priceLabel1').text(ui.values[0])
        $('#priceLabel2').text(ui.values[1])
        update()
    }
})


$('#mileage-slider').slider({
    range: true,
    max: 70000,
    min: 0,
    step: 100,
    values: [0, 160000],
    slide: (event, ui) => {
        $('#mileageLavel1').text(ui.values[0] == 0 ? 'New' : ui.values[0])
        $('#mileageLavel2').text(ui.values[1])
        update()

    }
})


function refreshSliders(priceMin, priceMax, mileageMin, mileageMax) {
    $('#mileage-slider').slider("option", "min", mileageMin)
    $('#mileage-slider').slider("option", "max", mileageMax)
    $('#mileage-slider').slider("refresh")

    $('#price-slider').slider("option", "min", priceMin)
    $('#price-slider').slider("option", "max", priceMax)
    $('#price-slider').slider("refresh")
}


let MAP_WIDTH = 500
let MAP_HEIGHT = 300


function handleCheckbox() {
    let selectedNames = []
    let checkboxes = document.getElementsByName("names")
    let checkedCount = 0;

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            checkedCount++;
        }
        if (checkedCount > 2) {
            checkboxes[i].checked = false;
        }
    }

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedNames.push(checkboxes[i].value)
        }
    }
    const url = `https://carsonsale-api.vercel.app/${selectedNames.join(",")}`
    // const url = `http://127.0.0.1:8000/${selectedNames.join(",")}`

    const promises = [
        d3.json(url),
        d3.json("data/concentrated europe map.json")
    ]

    Promise.all(promises).then(function (data) {
        carsMapData = data[0]['data']
        activeCC = data[0]['cc']
        removeMap()
        mapData = data[1]
        drawMap(activeCC)
        update()
    })
}


handleCheckbox()

function update() {
    const fuel = $('#fuel-type').val()

    // FILTER DATA
    const fuelFilData = dataFilMenu(fuel, "fuel_type", carsMapData)

    // TRANSFORM DATA
    const groupedData = d3.group(fuelFilData, d => d.manufacturer)

    // GRAPHS
    removeHexGraph()
    addHexGraph(groupedData)
    removePie()
    addPie(groupedData)

}


function convertStrToNum(data) {
    for (const key of data.keys()) {
        data.get(key).forEach(d => {
            d.date_of_manufacturing = Number(d.date_of_manufacturing)
            d.engine_power = Number(d.engine_power)
            d.latitude_coordinates = Number(d.latitude_coordinates)
            d.longitude_coordinates = Number(d.longitude_coordinates)
            d.mileage = Number(d.mileage)
            d.price = Number(d.price)
        })
    }
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

