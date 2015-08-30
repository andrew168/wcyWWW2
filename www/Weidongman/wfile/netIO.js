/**
 * save and open through internet
 * 都是JSON数据
 */

var NET_IO_DATA_TYPE = 'text';
function zipBlob(filename, blob, callback) {
    // use a zip.BlobWriter object to write zipped data into a Blob object
    zip.createWriter(new zip.BlobWriter("application/zip"), function(zipWriter) {
        // use a BlobReader object to read the data stored into blob variable
        zipWriter.add(filename, new zip.BlobReader(blob), function() {
            // close the writer and calls callback function
            zipWriter.close(callback);
        });
    }, onerror);
}


function netSave(filename, dataBuffer,keywords,otherObj)
{
    var f=new FormData();
    var flag=false;
    //是否是定时保存
    if(otherObj==null || otherObj.isTimeSaveWcy==false){
        $('#messagediv_content').html(TQ.Dictionary.IS_SAVING);
        easyDialog.open({
            container : 'messagediv'
        });
        flag=true;
    }else{
        //定时保存需要转成json
        dataBuffer=JSON.parse(dataBuffer);
        flag=false;
    }
    f.append('filename',filename);
    f.append('userID',localStorage.getItem("userID"));
    f.append('publish_v',$('#save-file #publish').val());
    f.append('keywords',keywords);
    f.append('wdmFile',JSON.stringify(dataBuffer));

    $.ajax({
        url: 'http://'+TQ.Config.DOMAIN_NAME+'/wcy/save',
        type: "post",
        contentType: false, //必须
        processData: false, //必须
        data:f
    })
    .done(function(msg){
        msg=JSON.parse(msg);
        if(msg.name!=undefined && msg.name!=''){
            TQ.Init.wcyTempName=msg.name;
        }
        if(flag){
            displayInfo3();
        }
        NET_IO_DATA_TYPE
    })
    .done(function(){
        TQ.Init.saveServerWcyProcess=0;
    })
}

function netOpen(filename, callback)
{
    var para = "filename="+filename;
    $.get('http://'+TQ.Config.DOMAIN_NAME+'/wcy/wdmOpen',para, callback, NET_IO_DATA_TYPE);
}

function onDelete(msg) {
    displayInfo2(msg);
    if (msg.indexOf(TQ.Dictionary.FAILED) < 0) { // 不成功
        localStorage.setItem("sceneName", "");
        $("#newScene").click();
    }
}

/*
function netDelete(wcyID)
{
    var para = "&userID=" + localStorage.getItem("userID");
    $.post('http://'+TQ.Config.DOMAIN_NAME+'/Weidongman/wfile/netDelete.php?wcyID='+wcyID + para, null, onDelete, NET_IO_DATA_TYPE);
}
*/
