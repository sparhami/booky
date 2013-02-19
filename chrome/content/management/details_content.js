window.addEventListener('load', function() {
    let elem = document.getElementById('detailsContentWindow');
    elem.data = { 'window': window };
    
    let evt = document.createEvent("Events");
    evt.initEvent('com_sppad_booky_details_page_load', true, false);
    
    elem.dispatchEvent(evt);
});