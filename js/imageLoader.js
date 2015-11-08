var ImageLoader = (function(){
  //Image loader helper
  var _results = {};
  var _loadImages = function(images, cb){
    for (var key in images){
      //Create new image
      var img = new Image();
      //Store key on alt attribute
      img.alt = key;
      img.onload = function(){
        //Set the loaded image to the results object using the stored key
        _results[this.alt] = this;
        //if all images are loaded, execute callback, if exists
        if (Object.keys(_results).length === Object.keys(images).length
            && typeof cb === 'function')
            cb(_results);
      };
      img.src = images[key];
    }
  };
  return {
    loadImages: _loadImages
  };
})();
