// jQUERY ELEMENTS


$('#fuel-type')
// .on('change', () =>
//     update())


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


function handleCheckbox(checked) {
    let clickedCheckbox
    if (checked === 'bmw') {
        clickedCheckbox = 'bmw'
    } else {
        clickedCheckbox = checked.value;
    }
    let selectedNames = [];
    let checkboxes = document.getElementsByName("manufacturerName");

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedNames.push(checkboxes[i].value);
        }
    }
    if (selectedNames.length > 2) {
        for (const checkbox of checkboxes) {
            if (checkbox.checked && checkbox.value !== clickedCheckbox) {
                checkbox.checked = false
                selectedNames = selectedNames.filter(name => name !== checkbox.value)
                break;
            }
        }
    }

    selectedNames = selectedNames.map(name => name.toLowerCase())
    let selectedCheckboxes = selectedNames.join(",")
    console.log(selectedCheckboxes)
    update(selectedCheckboxes)
}

handleCheckbox('bmw')

function uncheckAllCheckboxes() {
    var checkboxes = document.getElementsByName("manufacturerName")

    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false
    }
}
