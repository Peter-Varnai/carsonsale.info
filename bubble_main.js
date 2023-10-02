const BUBBLE_WIDTH = 928;
const BUBBLE_HEIGHT = BUBBLE_WIDTH;
const margin = 1;
const color = d3.scaleOrdinal(d3.schemeTableau10);




// Create the pack layout.
const pack = d3.pack()
    .size([BUBBLE_WIDTH - margin * 2, BUBBLE_HEIGHT - margin * 2])
    .padding(1)


function updateBubbleChar() {
    console.log("bubble chart")
    const groupedObjects = Object.fromEntries(groupedData)

    const bubbleData = {}
    const ccKeys = Object.keys(groupedObjects)
    ccKeys.forEach(key => {
        bubbleData[key] = 0
        groupedObjects[key].forEach(car => {
            // console.log(Number(car["price"]))
            bubbleData[key] += Number(car["price"])
        })
    })
    console.log(bubbleData)

        const svg = d3.select('#chart-area').append('svg')
        .attr("width", BUBBLE_WIDTH)
        .attr("height", BUBBLE_HEIGHT)
        .attr("viewBox", [-margin, -margin, BUBBLE_WIDTH, BUBBLE_HEIGHT])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    const node = svg.append("g")
        .selectAll()
        .data(bubbleData.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.manufacturer))
        .attr("r", d => (d.r));

    node.append("title")
        .text(d => d.data.manufacturer)

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);

    // console.log(names(d.data))
    text.selectAll()
        .data(d => d.data)
        .join("tspan")

// (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
    text.append("tspan")
        // .attr('style', d => `font-size: ${(d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`}`)
        .attr('style', d => `font-size: ${d.r / 2}px;`)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill-opacity", 0.7)
        .text(d => d.data.manufacturer);
}

Promise.all(promises).then(function (data) {


    const data_less = [];
    const data_sum = data.reduce((result, current) => {
        if (current.no_on_sale < 300) {
            for (const key in current) {
                if (key !== 'manufacturer') {
                    result[key] = (result[key] || 0) + current[key];
                }
            }
            result.manufacturer = 'sonstiges';
        } else {
            data_less.push(current);
        }
        return result;
    }, {});

    data = data_less.sort((a, b) => b.price_sum - a.price_sum);
    data.push(data_sum);
    data = pack(d3.hierarchy({children: data})
        .sum(d => d.no_on_sale));


    // Create the SVG container.
    const svg = d3.select('#chart-area').append('svg')
        .attr("width", BUBBLE_WIDTH)
        .attr("height", BUBBLE_HEIGHT)
        .attr("viewBox", [-margin, -margin, BUBBLE_WIDTH, BUBBLE_HEIGHT])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    const node = svg.append("g")
        .selectAll()
        .data(data.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.manufacturer))
        .attr("r", d => (d.r));

    node.append("title")
        .text(d => d.data.manufacturer)

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);

    // console.log(names(d.data))
    text.selectAll()
        .data(d => d.data)
        .join("tspan")

// (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
    text.append("tspan")
        // .attr('style', d => `font-size: ${(d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`}`)
        .attr('style', d => `font-size: ${d.r / 2}px;`)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill-opacity", 0.7)
        .text(d => d.data.manufacturer);
})


