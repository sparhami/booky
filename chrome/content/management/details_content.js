sendEvent = function(aType, aData) {
    let elem = document.getElementById('detailsContentWindow');
    elem.data = aData;
    
    let evt = document.createEvent("Events");
    evt.initEvent(aType, true, false);
    
    elem.dispatchEvent(evt);
};

window.addEventListener('load', function() {
    sendEvent('com_sppad_booky_details_page_load', { 'window': window });
});

window.addEventListener('beforeunload', function() {
    sendEvent('com_sppad_booky_details_page_beforeunload', { 'window': window });
});