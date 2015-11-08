var Util = (function(){
  return {
    clearCanvas: function(canvas){
      //clear canvas helper
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
    transferCanvas: function(canvasFrom, canvasTo){
      //transfer data between canvas helper. Used to buffer the image data before showing
      var sourceContext = canvasFrom.getContext('2d');
      var destContext = canvasTo.getContext('2d');
      var imgData = sourceContext.getImageData(0, 0, canvasFrom.width, canvasFrom.height);
      destContext.putImageData(imgData, 0, 0, 0, 0, canvasFrom.width, canvasFrom.height);
    },
    random: function(min, max){
      //generate random number between range
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    checkBoxCollision: function(box1, box2){
      //check collision between boxes
      return box1.x < box2.x + box2.w && //onde o player começa menor que onde o item termina - horizontal
              box1.x + box1.w > box2.x && //onde o player termina maior que onde o item começa - horizontal
              box1.y < box2.y + box2.h && //onde o player começa menor que onde o item termina - vertical
              box1.y + box1.h > box2.y; //onde o player termina maior que onde o item começa - vertical
    }
  };
})();
