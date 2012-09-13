/*
 * IMDB watchlist importer for movies.io
 */

(function(){
    if (window.File && window.FileList && window.FileReader && window.Blob) {
        // ok
    } else {
        alert('HTML5 File API not completely present');
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    
        var files = evt.dataTransfer.files,
            file, reader, contents, lines,
            line, columns, title, url;
        
        for (var i = 0; file = files[i]; i++) {
            reader = new FileReader();            
            reader.onload = function(progEvent){
                contents = progEvent.target.result;
                lines = contents.split(/\r\n|\r|\n/g);
                
                for(var j = 0; line = lines[j]; j++){
                    if (j === 0) continue;                  // CSV header
                    
                    columns = line.split(/",/);
                    title = columns[5].substring(1);
                    url = 'http://movies.io/m/suggestions?term=' + encodeURIComponent(title);
                    
                    jQuery.getJSON(url, (function(t){
                        return function(data){
                            handleSuggestionsList(data, t);
                        }
                    })(title));
                }
            };
            reader.readAsText(file);
        }
    }
    
    function handleSuggestionsList(data, title) {
        var titleId = -1,
            suggTitle,
            item;
        
        for (var i = 0; i < data.length; i++) {
            item = data[i];
            suggTitle = item.label.substring(0, item.label.length-6).trim(); 
            if (suggTitle == title) {
                //console.log('Found exact match for ' + title + ' (' + suggTitle + ') ' + ' with id ' + item.id);
                titleId = item.id;

                jQuery.ajax({
                    type : 'POST',
                    url : 'http://movies.io/w/dwt/m',
                    data : {
                        authenticity_token : '',
                        lang_code : 'en',
                        movie_id : item.id,
                        name : item.label,
                        utf8 : ''
                    }
                }).done(function(data){
                    //console.log('Server responded: ' + data.response);
                });
                
                break;
            }        
        }
        
        if (titleId === -1) {
            console.log('Id for title ' + title + ' not found.');
        }
    }

    var dropFileArea = document.getElementById('content');
    dropFileArea.addEventListener('dragover', handleDragOver, false);
    dropFileArea.addEventListener('drop', handleFileSelect,  false);
})();
