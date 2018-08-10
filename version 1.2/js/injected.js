var isMsgDateInRange = function(msg, first, second) {
    if (first === null && second === null)
        return true;
    else {
        return (msg.date >= first && msg.date <= second);
    }
};

var proceedMessages = function(details, messageIDs, TGSaver, cb) {
    var curFiles = [];

    for (var i = 0; i < messageIDs.length; i++) {            

            var m = TGSaver.getAppMesManager().wrapForHistory(messageIDs[i]);  
                    
            if (isMsgDateInRange(m, details.firstDate, details.secondDate) && m.media) {  
                
                if (details.types.includes('pics') && m.media._ === "messageMediaPhoto") {                    
                  
                    var fullSize = m.media.photo.sizes[m.media.photo.sizes.length-1];
                    var picID = moment.unix(m.date).format("YYYY_MM_DD") + '_' + m.media.photo.id;

                    var inputFileLocation = {
                        _: 'inputFileLocation',
                        volume_id: fullSize.location.volume_id,
                        local_id: fullSize.location.local_id,
                        secret: fullSize.location.secret
                    };

                    curFiles.push({
                        ID: picID,
                        locID: fullSize.location.dc_id,
                        inputFileLocation: inputFileLocation,
                        fullSize: fullSize.size
                    });
                }
                if (m.media._ === "messageMediaDocument") {
                    
                    var docID = null;
                    
                    // vids and voice msgs
                    if (m.media.document.type) {
                        if (m.media.document.type === 'video' && details.types.includes('vids')
                           ||
                           m.media.document.type === 'voice' && details.types.includes('voice')
                           ||
                           m.media.document.type === 'sticker' && details.types.includes('stickers'))
                            docID = moment.unix(m.date).format("YYYY_MM_DD") + '_' + m.media.document.id + '.' +
                                m.media.document.mime_type.split('/').pop();                        
                    }
                     
                    // other files
                    else {
                        if (details.types.includes('files'))
                            docID = moment.unix(m.date).format("YYYY_MM_DD") + '_' + m.media.document.file_name;
                    }
                    
                    if (docID) {
                        var inputDocFileLocation = {
                            _: "inputDocumentFileLocation",
                            id: m.media.document.id,
                            access_hash: m.media.document.access_hash,
                            version: m.media.document.version,
                            file_name: m.media.document.file_name
                        };

                        curFiles.push({
                            ID: docID,
                            locID: m.media.document.dc_id,
                            inputFileLocation: inputDocFileLocation,
                            fullSize: m.media.document.size,
                            extension: m.media.document.mime_type.split('/').pop()
                        });
                    }
                   
                }
            }                

    }

    if (curFiles.length == 0)
        cb();

    var count = 0;
    for (var i = 0; i < curFiles.length; i++) {

        var curFile = curFiles[i];           

        (function(curFile) {

            TGSaver.getMtpApiFileManager().downloadFile(curFile.locID, curFile.inputFileLocation, curFile.fullSize/*, {
                                    mime: curFile.mimeType}*/)

                .then(function (blob) {  

                count++;
                TGSaver.incrementFilesCount(); 
                TGSaver.setSpinnerText('Downloaded media: ' + TGSaver.getFilesCount());                    
                
                var fileName = curFile.ID;
                if (curFile.extension === undefined)
                    fileName += '.' + blob.type.split('/').pop();
                TGSaver.addToFiles({name: fileName, file: blob});

                if (count == curFiles.length) {
                    cb();
                }
            });
        })(curFile);
    }
};

var getFiles = function(details, history, TGSaver) { 

    //debugger;        

    if (history.$$state.status === 1 && history.$$state.value) {
        var messageIDs = history.$$state.value.history;
        
        var sec = TGSaver.getAppMesManager().wrapForHistory(messageIDs[0]); 
        var fir = TGSaver.getAppMesManager().wrapForHistory(messageIDs[messageIDs.length-1]); 
        TGSaver.setSpinnerText('Getting history...\r\n' + 'Current date range: \r\n' + moment.unix(fir.date).format("Do MMM YYYY") + '\r\n - \r\n' + moment.unix(sec.date).format("Do MMM YYYY"));

        proceedMessages(details, messageIDs, TGSaver, function() {    
            
            
            if (TGSaver.getMaxID() === undefined || fir.date < details.firstDate) {

                if (TGSaver.getFiles().length > 0) {
                    TGSaver.setSpinnerText('Creating zip-archive...');
                    var data = { type: "FROM_PAGE", files: TGSaver.getFiles(), title: TGSaver.getChatTitle()};
                    window.postMessage(data, "*");
                }
                else {
                    alert('No media for the chosen period.');
                    TGSaver.stopSpin();
                }
            }
            else {
                TGSaver.setMaxID(messageIDs[messageIDs.length-1]);
                history = TGSaver.getAppMesManager().getHistory(TGSaver.getUserID(), TGSaver.getMaxID(), TGSaver.getLimit());
                getFiles(details, history, TGSaver); 
            }
        });            

    }
    else {

        setTimeout(function(){
            getFiles(details, history, TGSaver)},  
                    200);
    }

};

document.addEventListener ("to_injected_get_media", function(e){

    
    // initialization
    (function(TGSaver) {
        
        var injector;
        
        // injector
        TGSaver.setInjector = function(i) {
            injector = i;
        };
        
        TGSaver.getInjector = function() {
            return injector;
        };
        
        // iRootScope
        var iRootScope;
        TGSaver.setIRootScope = function(i) {
            iRootScope = i;
        };
        
        TGSaver.getIRootScope = function() {
            return iRootScope;
        };  
        
        // appMesManager
        var appMesManager;
        TGSaver.setAppMesManager = function(appMess) {
            appMesManager = appMess;
        };
        
        TGSaver.getAppMesManager = function() {
            return appMesManager;
        };  
        
        // mtpApiFileManager
        var mtpApiFileManager;
        TGSaver.setMtpApiFileManager = function(fileMess) {
            mtpApiFileManager = fileMess;
        };
        
        TGSaver.getMtpApiFileManager = function() {
            return mtpApiFileManager;
        };
        
        // userID
        var userID;
        TGSaver.setUserID = function(id) {
            userID = id;
        };
        
        TGSaver.getUserID = function() {
            return userID;
        };
        
        // limit of messages
        var limit;
        TGSaver.setLimit = function(l) {
            limit = l;
        };
        
        TGSaver.getLimit = function() {
            return limit;
        };
        
        // max id
        var maxID;
        TGSaver.setMaxID = function(m) {
            maxID = m;
        };
        
        TGSaver.getMaxID = function() {
            return maxID;
        };
        
        
        // array with files
        var files = [];
        
        TGSaver.addToFiles = function(file) {
            if (files.filter(function(e) { return e.name === file.name; }).length === 0)
                files.push(file);
        }
        
        TGSaver.getFiles = function() {
            return files;
        }
        
        
        // files count
        var filesCount = 0;
        
        TGSaver.incrementFilesCount = function() {
            filesCount++;
        }
        
        TGSaver.getFilesCount = function() {
            return filesCount;
        }
        
        
        // chat title
        var title;
        
        TGSaver.setChatTitle = function(t) {
            title = t;
        }
        
        TGSaver.getChatTitle = function() {
            return title;
        }
        
        
        // spinner
        var spinner, lbl, overlay;    
        
        TGSaver.spin = function() {
            spinner.spin($("body")[0]); 
        };
        
        TGSaver.initSpin = function() {
//            overlay = document.createElement('div');
//            overlay.id = '__over';
//            overlay.setAttribute('style', 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0.2;');
//            document.body.appendChild(overlay);

            lbl = document.createElement('p');
            lbl.id = '__infoText';
            lbl.setAttribute('style', 'position:fixed;top:50%;left:50%;width:260px;transform: translateX(-50%) translateY(-50%);font-family:Roboto,Helvetica Neue,Helvetica,Arial,sans-serif;font-size: 2em;color:#000000;line-height:1em;text-align: center;');
            lbl.textContent = 'Downloading media...';
            document.body.appendChild(lbl);

            var opts = {lines:70,length:27,width:3,radius:150,corners:1,rotate:0,direction:1,color:'#000000',speed:1,trail:60,shadow: false,hwaccel:false,className:'spinner',zIndex:2e9,top:'50%',left:'50%',position:'fixed'};   

            spinner = new Spinner(opts);
        };       
        
        TGSaver.stopSpin = function() {
            if (spinner)
                spinner.stop();        
            if (overlay)
                overlay.parentNode.removeChild(overlay);        
            if (lbl)
                lbl.parentNode.removeChild(lbl);
        };
        
        TGSaver.setSpinnerText = function(text) {
            if (lbl)
                lbl.textContent = text;
        }
        
        
    })(TGSaver = {});
    
    
    TGSaver.initSpin();  
    TGSaver.spin();
    
   
    
    // init injector and managers
    TGSaver.setInjector(angular.element(document).injector());
    TGSaver.setIRootScope(TGSaver.getInjector().get('$rootScope'));
    TGSaver.setAppMesManager(TGSaver.getInjector().get('AppMessagesManager'));
    TGSaver.setMtpApiFileManager(TGSaver.getInjector().get('MtpApiFileManager'));
    
    TGSaver.setUserID(TGSaver.getIRootScope().selectedPeerID);
    TGSaver.setLimit(2000);
    TGSaver.setMaxID(0);    
   
    var realID = (TGSaver.getUserID() < 0 ? -TGSaver.getUserID() : TGSaver.getUserID());
    var chatInfo = TGSaver.getInjector().get('AppChatsManager').wrapForFull(realID, {});
        
    if (chatInfo.chat.title) {
        TGSaver.setChatTitle(chatInfo.chat.title);
    }
    else {
        var curUser = TGSaver.getInjector().get('AppPeersManager').getPeer(realID);
        TGSaver.setChatTitle(curUser.username);
    }        
   
    var history = TGSaver.getAppMesManager().getHistory(TGSaver.getUserID(), 0, TGSaver.getLimit());
    var details = JSON.parse(e.detail);
    getFiles(details, history, TGSaver); // userID, 0, limit);

}, false);


document.addEventListener ("finish", function(e){   
    TGSaver.stopSpin();
}, false);

document.addEventListener ("set_spinner_text", function(e){  
    var msg = JSON.parse(e.detail);
    TGSaver.setSpinnerText('Creating zip-archive...' + msg.number + ' out of ' + msg.count);
}, false);
