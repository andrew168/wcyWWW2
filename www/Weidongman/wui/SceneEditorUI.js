TQ = TQ || {};
(function () {

  function SceneEditorUI() {}
  var p = SceneEditorUI;
  p.filename_str = null;
  p.promptToSave = function(filename) {
    SceneEditorUI.filename_str = filename;
    MYJS.alert_obj.alert(TQ.Dictionary.SaveItPlease,2,'yes',function(){
      save();
      openScene(TQ.SceneEditorUI.filename_str);
      $('#save').trigger('click');
    },'no',function(){
      MYJS.alert_obj.close(2);
    },'abandonbtn',function(){
      window.location.href='http://'+TQ.Config.DOMAIN_NAME+'/wcy/index'; 
    });
  };

  TQ.SceneEditorUI = SceneEditorUI;
}());
