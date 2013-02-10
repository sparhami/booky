sendEvent = function(aType, aData) {
    let elem = document.getElementById('detailsContentWindow');
    elem.data = aData;
    
    let evt = document.createEvent("Events");
    evt.initEvent(aType, true, false);
    
    elem.dispatchEvent(evt);
};

window.addEventListener('load', function() {
    sendEvent('com_sppad_booky_details_page_loaded', { 'document': document });
});

window.addEventListener('unload', function() {
    sendEvent('com_sppad_booky_details_page_unloaded', { 'document': document });
});