const WIDTH = 160


const height = Math.min(WIDTH, 500);
const radius = Math.min(WIDTH, height) / 2;


const pie = d3.pie()
    .padAngle(6 / radius)
    .sort(null)
    .value(d => d.noOnSale)


d3.select("#pie-chart-area").append("p")
    .text("Distribution of fuel types in selection")
    .attr("class", "legend-title")

const arc = d3.arc()
    .cornerRadius(2)
    .innerRadius(12)
    .outerRadius(radius)


function removePie() {
    const t = d3.transition().duration(100).delay((d, i) => i * 120)
    d3.selectAll(".pieLegendDigits").transition(t).attr("transform", "scale(0)")
    d3.selectAll(".pieLegendDigits").transition(t).remove()
    d3.selectAll(".piePath").transition(t).attr("transform", "scale(0)")
    d3.selectAll(".piePath").transition(t).remove()
    d3.selectAll(".pieLegend").transition(t).attr("transform", "scale(0)")
    d3.selectAll(".pieLegend").transition(t).remove()
    d3.selectAll(".pie-legend-svg").remove()
    d3.selectAll(".pieDiv").remove()
}


// function fuelTypeCheck(fType) {
//     const fuelType1 = ["Diesel", "Gasoline", "Hybrid"];
//     const fuelType2 = ["Electric/Diesel", "Electric/Gasoline"];
//
//     if (fuelType1.includes(fType)) {
//         return fType.toLowerCase();
//     } else if (fuelType2.includes(fType)) {
//         return "hybrid";
//     } else if (fType === "Electric") {
//         return "electric";
//     } else {
//         // console.log(fType)
//         return "others";
//     }
// }
//
//
// function fuelTypeDataCorrector(map) {
//     if (map.has("Electric/Diesel" || map.has("Elecric/Gasoline"))) {
//         const electricDieselArray = map.get("Electric/Diesel");
//         if (map.has("Hybrid")) {
//             const hybridArray = map.get("Hybrid");
//             map.set("Hybrid", hybridArray.concat(electricDieselArray));
//         } else {
//             map.set("Hybrid", electricDieselArray);
//         }
//         map.delete("Electric/Diesel")
//         map.delete("Electric/Gasoline")
//     }
//     if (map.has("Gas")) {
//         const gasArray = map.get("Gas")
//         if (map.has("Others")) {
//             const othersArray = map.get("Others")
//             map.set("Others", othersArray.concat(gasArray))
//         } else {
//             map.set("others", othersArray)
//         }
//         map.delete("Gas")
//     }
//     return map;
// }


function addPie(dataIn) {
    const fuelTypes = []
    for (const key of dataIn.keys()) {
        const data = dataIn.get(key)
        const carManufacturer = data[0][5]
        const pieDiv = d3.select("#pie-chart-area")
            .append('div')
            .attr('class', 'pieDiv')

        const pieTitle = pieDiv.append("div")
            .attr("class", "pie-title")

        pieTitle.append('svg')
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("viewBox","0 0 100 100")
            .style("max-height", "30px")
            .style("max-width", "30px")
            .append("path")
            .attr("d","M50 2.5 L95 25 L95 75 L50 97.5 L5 75 L5 25 Z")
            .attr("class", `${carManufacturer}-path`)


        pieTitle.append('p').text(carManufacturer)
            .attr("class", "smaller-legend-title")

        const pieSvg = pieDiv.append("svg")
            .attr("width", WIDTH)
            .attr("height", height)
            .attr("class", "pie-svg")
            .attr("viewBox", [-WIDTH / 2, -height / 2, WIDTH, height])
            .attr("style", "max-width: 100%; height: auto;")


        const fuelTypeGroupData = d3.group(data, d => d[2])
        const aggregatedData = Array.from(fuelTypeGroupData.entries())
            .map(([fuelType, aggData]) => {
                fuelTypes.includes(fuelType) ? undefined : fuelTypes.push(fuelType)
                return {
                    fuel_type: fuelType,
                    noOnSale: aggData.length,
                    total_mileage: d3.sum(aggData, d => d[6]),
                    average_price: d3.mean(aggData, d => d[7]),
                }
            })


        pieSvg.append("g")
            .attr("class", "pie-group")
            .selectAll()
            .data(pie(aggregatedData))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("class", d => d.data.fuel_type + " piePath")
            .attr("transform", "scale(0)")
            .transition().duration(300).delay((d, i) => i * 120)
            .attr("transform", "scale(1)")


        pieSvg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .selectAll()
            .data(pie(aggregatedData))
            .join("text")
            .attr("class", "pieLegendDigits")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => d.data.noOnSale.toLocaleString("en-US")))
            .attr("opacity", 0)
            .transition().duration(300).delay((d, i) => i * 200)
            .attr("opacity", 1)
    }


    // ADDING LEGEND
    const pieLegendSvg = d3.select("#pie-chart-area").append("svg")
        .attr("width", 90)
        .attr("height", 180)
        .attr("class", "pie-legend-svg")

    let legends = pieLegendSvg.append("g")
        .selectAll(".legends")
        .data(fuelTypes)

    let legend = legends
        .enter()
        .append("g")
        .attr("class", d => d + " pieLegend")
        .attr("transform", function (d, i) {
            return `translate(12, ${(i + 1) * 30})`
        })

    legend.append("circle")
        .attr("r", 8)

    legend.append("text")
        .text(d => d)
        .attr("fill", "black")
        .attr("transform", "translate(18,5)")
        .attr('class', 'pie-legend-text')

    legend.attr("opacity", 0)
        .transition().duration(300).delay((d, i) => i * 200)
        .attr("opacity", 1)
}
