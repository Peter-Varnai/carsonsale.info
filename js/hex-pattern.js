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
    .radius(10)
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
            .attr("class", `${key}-path`)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .attr("d", "m0,0l0,0l0,0l0,0l0,0l0,0z")
            .transition().duration(800).delay((d, i) => i * 4)
            .attr("d", d => hexbin.hexagon(radius(d.length)))
            .call(tip);
    }
}


function removeHexGraph() {
    const t = d3.transition().duration(600)
    d3.selectAll(".hexPath").transition(t).attr("d", "m0,0l0,0l0,0l0,0l0,0l0,0z").remove()
}

hexGroup.raise()
