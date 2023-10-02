// jQUERY ELEMENTS


$('#car-brands')
    .on('change', () =>
        update())

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
const dataLimitTo = 1200


const promises = [
    d3.json("data/concentrated europe map.json"),
    d3.csv('data/cars_on_sale.csv'),
]


// const path = d3.geoPath().projection(projection);
Promise.all(promises).then(function (data) {
    mapData = data[0]
    carsMapData = data[1]
    drawMap()
    update()
});


function update() {
    const fuel = $('#fuel-type').val()
    const brand = $('#car-brands').val()
    const price = $('#price-slider').slider('values')
    const mileage = $('#mileage-slider').slider('values')


    // FILTER DATA
    const fuelFilData = dataFilMenu(fuel, "fuel_type", carsMapData)
    const brandFilData = dataFilMenu(brand, "manufacturer", fuelFilData)
    const priceFilData = dataFilRange(price, 'price', brandFilData)
    const mileageFilData = dataFilRange(mileage, "mileage", priceFilData)


    // TRANSFORM DATA
    const groupedData = d3.group(mileageFilData, d => d.manufacturer)
    convertStrToNum(groupedData)


    // GRAPHS
    removeHexGraph()
    addHexGraph(groupedData)
    removePie()
    addPie(groupedData)
}


function limitToNumber(data) {
    // LIMITING DATA TO 1200
    // const limitedRandArray = []
    const limitedRandDict = {}
    data.forEach((d, cc) => {
        const newArray = getRandomElements(d, dataLimitTo)
        // limitedRandArray.push(...newArray)
        limitedRandDict[cc] = newArray
    })
}

function getRandomElements(arr, numElements) {
    const result = []
    if (arr.length <= dataLimitTo) {
        return arr
    } else {
        for (let i = 0; i < numElements; i++) {
            let randomIndex = Math.floor(Math.random() * arr.length)
            while (result.includes(arr[randomIndex])) {
                randomIndex = Math.floor(Math.random() * arr.length)
            }
            result.push(arr[randomIndex])
        }
        return result
    }
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


function dataFilRange(mValue, filterCol, data) {
    return data.filter(d => {
        return d[filterCol] >= mValue[0] && d[filterCol] <= mValue[1]
    })
}
