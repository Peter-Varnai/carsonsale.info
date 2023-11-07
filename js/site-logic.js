// jQUERY ELEMENTS
// $('#fuel-type')
// .on('change', () =>
//     update())
// $('#price-slider').slider({
//     range: true,
//     max: 900000,
//     min: 0,
//     step: 100,
//     values: [0, 600000],
//     slide: (event, ui) => {
//         $('#priceLabel1').text(ui.values[0])
//         $('#priceLabel2').text(ui.values[1])
//         update()
//     }
// })
//
//
// $('#mileage-slider').slider({
//     range: true,
//     max: 70000,
//     min: 0,
//     step: 100,
//     values: [0, 160000],
//     slide: (event, ui) => {
//         $('#mileageLavel1').text(ui.values[0] == 0 ? 'New' : ui.values[0])
//         $('#mileageLavel2').text(ui.values[1])
//         update()
//     }
// })
//
//
// function refreshSliders(priceMin, priceMax, mileageMin, mileageMax) {
//     $('#mileage-slider').slider("option", "min", mileageMin)
//     $('#mileage-slider').slider("option", "max", mileageMax)
//     $('#mileage-slider').slider("refresh")
//
//     $('#price-slider').slider("option", "min", priceMin)
//     $('#price-slider').slider("option", "max", priceMax)
//     $('#price-slider').slider("refresh")
// }


// ____________DATA DESCRIPTION___________________//
const dataDescDiv = d3.select("#data-description")
const dataDescN = dataDescDiv.append("p")

dataDescDiv.append("p")
    .html("Between <br>June and July of 2023 <br>web scraped from <span style='font-style: italic;'>'wh.at'</span> and <span style='font-style: italic;'>'as24.com'</span>")

function dataDesc(n) {
    dataDescN.html(`Number of cars on screen: <br><span style="font-size: 1.25em; font-weight: bold">${n} / 171032</span>`)
}

//______________FILTER BUTTON LOGIC_____________//
const filterButton = document.getElementById("filterButton")
const filterMenu = document.getElementById("filterMenu")

filterButton.addEventListener("click", function () {
    filterMenu.classList.toggle("hidden")
})


//______________CHECKBOXES LOGIC________________//
function handleCheckbox(checked) {
    let clickedCheckbox
    if (checked === 'bmw') {
        clickedCheckbox = 'bmw'
    } else {
        clickedCheckbox = checked.value;
    }
    let selectedNames = [];
    let checkboxes = document.getElementsByName("manufacturerName");
    // if (checked.checked === true && ) {
    //     console.log('checked is true')
    // }
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedNames.push(checkboxes[i].value);
        }
    }
    console.log(selectedNames)

    if (selectedNames.length > 2) {
        for (const checkbox of checkboxes) {
            if (checkbox.checked && checkbox.value !== clickedCheckbox) {
                checkbox.checked = false
                selectedNames = selectedNames.filter(name => name !== checkbox.value)
                break;
            }
        }
    }
    if (selectedNames.length === 0) {
        console.log("CHECKED IS TTRUE")
        checked.checked = true
        selectedNames.push(clickedCheckbox)
    }
    selectedNames = selectedNames.map(name => name.toLowerCase())
    let selectedCheckboxes = selectedNames.join(",")
    update(selectedCheckboxes)
}

function uncheckAllCheckboxes() {
    var checkboxes = document.getElementsByName("manufacturerCheckbox")
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false
    }
}

handleCheckbox('bmw')


// _________ABOUT WINDOW OPEN - CLOSE____________//
function toggleAboutPopup() {
    let popup = document.getElementById("aboutPopUp");
    console.log(popup.style.display)
    if (popup.style.display === "none") {
        popup.style.display = "flex";

    } else {
        popup.style.display = "none";
    }
}


document.getElementById("aboutPopUpX").addEventListener("click", toggleAboutPopup);
document.getElementById("aboutPopUpButton").addEventListener("click", toggleAboutPopup);


// function uncheckAllCheckboxes() {
//     var checkboxes = document.getElementsByName("manufacturerName")
//
//     for (var i = 0; i < checkboxes.length; i++) {
//         checkboxes[i].checked = false
//     }
// }
