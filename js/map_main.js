//____________________________MAP ELEMENTS________________________//
const mapSvg = d3.select('#map-chart-area').append('svg')
    .attr("width", "100%")
    .attr("height", "100%")
    .on("click", reset)

const projection = d3.geoNaturalEarth1()
    .center([13, 51])
    .scale(4700)

const mapMaiGroup = mapSvg.append("g")
    .attr('class', 'viewPort')

const path = d3.geoPath()
    .projection(projection);

const paths = mapMaiGroup.append('g')
    .attr('class', 'paths')


// EMPTY COUNTRIES PATTERN
mapSvg.append('pattern')
    .attr('id', 'emptyCountryPattern')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', '20')
    .attr('height', '20')


mapSvg.select('pattern')
    .append('rect')
    .attr('width', 30)
    .attr('height', 30)
    .attr('fill', 'white')

mapSvg.select('pattern')
    .append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 30)
    .attr('y2', 30)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('opacity', 0.1)

function drawMap(activeList) {
    paths.selectAll("path")
        .data(topojson.feature(mapData, mapData.objects.ne_10m_admin_0_countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr('class', d => d.properties.ISO_A2)
        // .style("fill", d => activeList.includes(d.properties.ISO_A2) ? 'rgb(244, 244, 244)' : 'url(#emptyCountryPattern')
        .style("fill", d => {
            return activeList.includes(d.properties.ISO_A2) ? 'rgb(244, 244, 244)' : 'url(#emptyCountryPattern'
        })
        .style('stroke', 'black')
}


function removeMap() {
    paths.selectAll('path').remove()
}


//______MAP NAVIGAION ELEMENTS____//
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);


window.addEventListener('resize', updateViewBox);
updateViewBox();

function updateViewBox() {
    MAP_WIDTH = mapSvg.node().clientWidth;
    MAP_HEIGHT = mapSvg.node().clientHeight;
    mapSvg.attr('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
}

function reset() {
    mapSvg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(mapSvg.node()).invert([MAP_WIDTH / 2, MAP_HEIGHT / 2])
    );
}

function zoomed(event) {
    const {transform} = event;
    // transform.x = Math.min(Math.max(transform.x, minX), maxX)
    // transform.y = Math.min(Math.max(transform.y, minY), maxY)
    mapMaiGroup.attr("transform", transform);
    mapMaiGroup.attr("stroke-width", 1 / transform.k);
}


//_______GRATICULES ON MAP____//
const graticulesG = mapMaiGroup.append('g')
    .attr('class', 'graticules')

const graticule = d3.geoGraticule()
    .step([2, 2]);

const graticuleData = graticule();

graticulesG.append('path')
    .datum(graticuleData)
    .attr("class", "graticule")
    .attr("d", path);


//___________HEXAGON PATTERN ON MAP___________//
const tip = d3.tip()
    .attr('class', 'd3-tip')
    .html((EVENT, d) => {
            let text = `<p>The avarage ...</p>`
            text += `<strong>price:</strong> <span style='color:red;text-transform:capitalize'>${(d.price)} €</span><br>`
            text += `<strong>mileage count:</strong> <span style='color:red;text-transform:capitalize'>${d.mileage} km</span><br>`
            text += `<strong>before selling usage:</strong> <span style='color:red'>${(2023 - d.date + 1)} year</span><br>`
            text += `<strong> number of articles found in this area:</strong> <span style='color:red'>${d.length}</span><br>`
            return text
        }
    )

const hexGroup = mapMaiGroup.append("g")
    .attr('class', "hex-group")


const hexbin = d3.hexbin()
    .extent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
    .radius(6)
    .x(d => d.xy[0])
    .y(d => d.xy[1])

function addHexGraph(data) {
    for (const key of data.keys()) {
        const dataGroup = data.get(key)
        const bin = hexbin(dataGroup.map(d => (
            {
                xy: projection([d[4], d[3]]),
                price: d[7],
                mileage: d[6],
                date: d[0],
                fuelType: d[2]
            }))).map((d) => {
                d.date = new Number(d3.median(d, (d) => d.date))
                d.mileage = new Number(d3.median(d, (d) => d.mileage))
                d.price = new Number(d3.median(d, (d) => d.price))
                return d
            }
        )
        const radius = d3.scaleSqrt([0, d3.max(bin, d => d.length)], [2, hexbin.radius() * Math.SQRT2 + 2])
        hexGroup.append("g")
            .attr("class", `${key} hexGraph`)
            .selectAll("path")
            .data(bin)
            .join("path")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("class", "hexPath")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .attr("d", "m0,0l0,0l0,0l0,0l0,0l0,0z")
            .transition().duration(800).delay((d, i) => i * 4)
            .attr("d", d => hexbin.hexagon(radius(d.length)))
            .call(tip);
    }
}

function removeHexGraph() {
    // const radius = d3.scaleSqrt([0, d3.max(bins, d => d.length)], [0, hexbin.radius() * Math.SQRT2]);
    const t = d3.transition().duration(600)
    d3.selectAll(".hexPath").transition(t).attr("d", "m0,0l0,0l0,0l0,0l0,0l0,0z").remove()
    // d3.selectAll(".hexGraph").transition(t).remove()

}


// ______DOTS ON MAP (disabled)_____//
const dotsGroup = mapMaiGroup.append('g')
    .attr('class', 'dots')


function updateMapDots() {
    // CARS ON THE MAP AS DOTS
    const dots = dotsGroup.selectAll("circle")
        .data(limitedRandArray)

    dots.exit().remove()

    dots.enter().append("circle")
        .attr("r", 1.4)
        .attr("fill", "#009CB9")
        .merge(dots)
        .attr("cx", d => projection([d["longitude_coordinates"], d["latitude_coordinates"]])[0])
        .attr("cy", d => projection([d["longitude_coordinates"], d["latitude_coordinates"]])[1])
}


//___FINAL ADJUSTMENTS TO MAP___//
graticulesG.lower()
hexGroup.raise()
mapSvg.call(zoom);


//____MISCELANIOUS FUNCTIONS___//
function printClasses(carBrands) {
    const cssClasses = carBrands.map(brand => `.${brand} path \n{fill:${getRandomColor()}\n}\n`).join('\n')
}


function getRandomColor() {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)

    const color = `rgb(${r}, ${g}, ${b})`
    return color
}


// // 1920 x 965 size:
// const minX = -380
// const maxX = 1021
// const minY = -602
// const maxY = 205
//
// // 320 x 480
// const minX = -934
// const maxX = 1021
// const minY = 190
// const maxY = 1058


// SMALL SCREEN
// lower corner
// x: 1001
// y: 1058

// upper corner
// x: -934
// y: 190

// VIEW LOWER CORNER SHOULD ADJUST ACCORDINGLY
// FROM FIRST TO SECOND VALUE IN ARR AS SCREEN MOVES FROM 320 - 1920
const lowerCorner = {
    "x": [1001, 1021],
    "y": [1058, -602]
}

// VIEW UPPER CORNER SHOULD ADJUST ACCORDINGLY
// FROM FIRST TO SECOND VALUE IN ARR AS SCREEN MOVES FROM 320 - 1920
const upperCorner = {
    "x": [-934, -380],
    "y": [190, 205]
}


// BIG SCREEN
// lower corner
// x: 1021
// y: -602

// upper corner
// x: -380
// y: 205
