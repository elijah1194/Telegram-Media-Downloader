var setUp = function() {
    
    var firstDate, secondDate;
    
    $('#date-picker').datepicker({
        onSelect: function(formattedDate, date, inst) {
                        
            if (date.length > 0) {
                
                firstDate = date[0].getTime()/1000;
                if (date.length === 2) {
                    secondDate = moment(date[1]).add(1, 'days').unix(); //date[1].getTime()/1000;
                }
                else {
                    secondDate = moment(date[0]).add(1, 'days').unix();
                }
            }
        }
    });
    
    chrome.storage.local.get(null, function (items) {  
        $('#pics').prop('checked', items.tg_pics);
        $('#videos').prop('checked', items.tg_vids);
        $('#files').prop('checked', items.tg_files);
        $('#voice').prop('checked', items.tg_voice);
        $('#sticker').prop('checked', items.tg_stickers);
    });
   
    
    document.getElementById('download').onclick = function () {   
        
        chrome.storage.local.set({
            tg_pics: $('#pics').prop('checked'),
            tg_vids: $('#videos').prop('checked'),
            tg_files: $('#files').prop('checked'),
            tg_voice: $('#voice').prop('checked'),
            tg_stickers: $('#sticker').prop('checked')
        }, function() {
            
            var types = [];
            if ($('#pics').prop('checked')) types.push('pics');
            if ($('#videos').prop('checked')) types.push('vids');
            if ($('#files').prop('checked')) types.push('files');
            if ($('#voice').prop('checked')) types.push('voice');
            if ($('#sticker').prop('checked')) types.push('stickers');
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {            

                chrome.tabs.sendMessage(tabs[0].id, {
                    key: "get_media", 
                    value: "pics",
                    dates: [firstDate, secondDate],
                    types: types
                }, null);

            }); 
            
        });
                              
   };     
};

document.addEventListener('DOMContentLoaded', setUp);