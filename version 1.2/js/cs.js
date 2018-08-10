function inject_script(script_name){
	var s = document.createElement('script');
	s.src = chrome.extension.getURL(script_name);
	(document.head||document.documentElement).appendChild(s);	
}

inject_script('js/moment-with-locales.min.js');
inject_script('js/spin.min.js');
inject_script('js/injected.js');




function zipBlob(files, title) {
    //debugger;
    zip.createWriter(new zip.BlobWriter("application/zip"), function(writer) {
        var start = new Date().getTime();

        var f = 0;

        function nextFile(f) {
            
            var fblob = new Blob([files[f].file], { type: files[f].file.type });
            writer.add(files[f].name, new zip.BlobReader(fblob), function() {
                // callback
                f++;       
                if (f < files.length) {
                    var msg = '{"number": "' + f + '", "count": ' + files.length + '}';
                    document.dispatchEvent(new CustomEvent('set_spinner_text',                                                           {'detail':msg}));
                    nextFile(f);
                } else close();
            });
        };

        function close() {
            // close the writer
            writer.close(function(blob) {
                saveAs(blob, title + '.zip');                                     
                document.dispatchEvent(new CustomEvent('finish'));   
            });
        };

        nextFile(f);

    }, onerror);
};


window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    
    if (event.data.type && (event.data.type == "FROM_PAGE")) {
       zipBlob(event.data.files, event.data.title);
    }
});


chrome.runtime.onMessage.addListener(function (request_msg, sender, sendResponse) {    
   
    if (request_msg.key === 'get_media') {
        var types = '[';
        for (var i = 0, len = request_msg.types.length; i < len; i++) {
            types += '"' + request_msg.types[i] + '"';
            if (i !== len - 1)
                types += ',';
        }
        types += ']';
            
        
        var details = '{"detail": "' + request_msg.value + '", "firstDate": ' + request_msg.dates[0] + ', "secondDate": ' + request_msg.dates[1] + ', "types": ' + types + '}';
        
        document.dispatchEvent(new CustomEvent('to_injected_get_media', {          
            'detail':details
        }));
    }    
});

