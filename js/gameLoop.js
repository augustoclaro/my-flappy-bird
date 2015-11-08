var GameLoop = (function(){
  //function to verify if given object is a function
  var _isFunction = function(obj){ return typeof obj === 'function'; };

  var _gameLoopData = {
    //default FPS
    FPS: 20,
    //initialize some loop vars
    lastTime: new Date().getTime(),
    currentTime: 0,
    interval: 0,
    delta: 0,
    action: function(){}
  };

  var GameLoop = function(o){
    //check parameter to accept loop action directly or options to override FPSS
    //and set the options
    if (_isFunction(o))
      _gameLoopData.action = o;
    else{
      if (_isFunction(o.action)) _gameLoopData.action = o.action;
      if (o.FPS) _gameLoopData.FPS = o.FPS;
    }
    //main loop function
    var _mainAction = function(){
      //check for paused state
      if (_gameLoopData.mode === 'running')
        window.requestAnimationFrame(_mainAction);
      //initialize current time
      _gameLoopData.currentTime = new Date().getTime();
      //set time variation between actions
      _gameLoopData.delta = _gameLoopData.currentTime - _gameLoopData.lastTime;
      //set ms interval
      _gameLoopData.interval = 1000 / _gameLoopData.FPS
      //ensure enough time has passed to execute loop action
      if (_gameLoopData.delta > _gameLoopData.interval){
        //run loop action
        _gameLoopData.action(_gameLoopData);
        //seting last time compensating the time overpassed
        _gameLoopData.lastTime = _gameLoopData.currentTime - _gameLoopData.delta % _gameLoopData.interval;
      }
    };
    var _start = function(){
      //set mode to running and call main loop
      _gameLoopData.mode = 'running';
      _mainAction();
      return GameLoop;
    };
    var _pause = function(){
      //set mode to pause forcing the loop to stop
      _gameLoopData.mode = 'pause';
      return GameLoop;
    };
    return {
      start: _start,
      pause: _pause
    };
  };
  return GameLoop;
})();
