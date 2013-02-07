window.addEventListener('load', function() {
    let element = document.getElementById('detailsContentWindow');
    element.document = document;
    
    let evt = document.createEvent("Events");

    evt.initEvent("com_sppad_booky_details_page_loaded", true, false);
    element.dispatchEvent(evt);
});

