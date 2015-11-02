var _imageLoader = (function(){
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

var _util = (function(){
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

var flapGame = (function(imageLoader, util){
  //Main game object
  var gameObj = {
    //Default player values
    defaults: {
      player: {
        x: 50,
        y: 50,
        gravity: 17 //gravity is the amount of pixels to sum to player Y every loop
      }
    },
    stage: 'start', //initial stage
    log: function(msg){
      //Log function. Using h2 to log messages
      document.getElementById('msg').innerText = msg;
    },
    inputData: {
      keyPressed: 0, //key code
      mouseClick: 0, //1=left click,2=right click
      clear: function(){
        gameObj.inputData.keyPressed =
          gameObj.inputData.mouseClick = 0;
      }
    },
    player: {
      //Player object
      points: 0,
      x: undefined,
      y: undefined,
      gravity: undefined,
      size: {
        width: 50,
        height: 50
      },
      renderToCanvas: function(){
        var ctx = gameObj.bufferCanvas.getContext('2d');
        //Draw bird's body
        ctx.fillStyle = 'red';
        ctx.fillRect(gameObj.player.x, gameObj.player.y, gameObj.player.size.width, gameObj.player.size.height);
        //Draw bird's beak
        ctx.fillStyle = 'yellow';
        ctx.fillRect(gameObj.player.x + gameObj.player.size.width - 5, gameObj.player.y + 12, 15, 10);
        //Draw bird's wing
        ctx.beginPath();
        ctx.moveTo(gameObj.player.x + 5, gameObj.player.y + 25);
        ctx.lineTo(gameObj.player.x + 40, gameObj.player.y + 25);
        ctx.lineTo(gameObj.player.x + 22.5, gameObj.player.y + (gameObj.player.wingUp ? 13 : 37));
        ctx.fill();
      }
    },
    gamePhysics: {
      //game physics config
      jumpGravity: 30,
      jumpLoops: 10,
      treeDistance: 350,
      treeSpeed: 10
    },
    createRandomTreePair: function(){
      //create tree pair. the x pos is the
      //game width or, if not the first one,
      //some pixels after the last one.
      //the y pos is a percentage of the canvas height
      //that represents the bottom of the upper tree. the
      //down tree is calculated through this value
      return {
        x: gameObj.treePairs.length
                    ? (gameObj.treePairs[gameObj.treePairs.length - 1].x + gameObj.gamePhysics.treeDistance)
                    : gameObj.gameSize.width,
        y: util.random(20, 60)
      };
    },
    //Main game FPS
    FPS: 20,
    //Game size configs
    gameSize: {
      width: 800,
      height: 600
    },
    //Init some vars
    gameLoop: undefined,
    gameCanvas: undefined,
    bufferCanvas: undefined,
    treePairs: undefined,
    //Tree size
    treeSize: {
      width: 82,
      height: 381
    },
    //Game image resources
    resources: {
      sky: '/img/sky.png'
    },
    createCanvas: function(){
      //Create canvas from game settings
      var el = document.createElement('canvas');
      el.setAttribute('width', gameObj.gameSize.width);
      el.setAttribute('height', gameObj.gameSize.height);
      return el;
    },
    detectInput: function(){
      //Set document event handlers to fill up inputData
      document.onkeypress = function(e){
        //Set key pressed code
        var key = e.keyCode || e.which;
        gameObj.inputData.keyPressed = key;
      };

      gameObj.gameCanvas.onclick = function(){
        //Set mouseClick to left click code
        gameObj.inputData.mouseClick = 1;
      };
    },
    startRound: function(){
      //Set initial values to new round
      gameObj.treePairs = [];
      //Set player data
      gameObj.player.x = gameObj.defaults.player.x;
      gameObj.player.y = gameObj.defaults.player.y;
      gameObj.player.gravity = gameObj.defaults.player.gravity;
      gameObj.player.points = 0;
      //Generate starting trees. ony 5 trees. The other ones will be
      //generated as the existing trees disapears
      for (var i = 1; i <= 5; i++)
        gameObj.treePairs.push(gameObj.createRandomTreePair())
    },
    init: function(parentElId){
      window.onload = function(){
        gameObj.log('Starting game and loading objects.');
        //Create game and buffer canvas. Set game canvas ID and append to parent elementgameObj
        gameObj.gameCanvas = gameObj.createCanvas();
        gameObj.bufferCanvas = gameObj.createCanvas();
        gameObj.gameCanvas.setAttribute('id', 'gameCanvas');
        var parentEl = document.getElementById(parentElId);
        parentEl.appendChild(gameObj.gameCanvas);
        //Start first round
        gameObj.startRound();
        //Load resources
        imageLoader.loadImages(gameObj.resources, function(loadedResources){
          gameObj.resources = loadedResources;
          //Start browser event handlers
          gameObj.detectInput();
          //Fire gameloop
          gameObj.startGameLoop();
        });
      };
    },
    startGameLoop: function(){
      //Start loop. Run gameObj.FPS times per second
      gameObj.gameLoop = setInterval(gameObj.loopAction, 1000 / gameObj.FPS)
    },
    loopAction: function(){
      //Update game entries
      gameObj.update();
      //Render game objects
      gameObj.render();
    },
    update: function(){
      //Detect player action through enter key, space bar and mouse left click
      var playerAction = gameObj.inputData.keyPressed === 32 ||
          gameObj.inputData.keyPressed === 13 ||
          gameObj.inputData.mouseClick === 1;

      if (gameObj.stage === 'start'){
        //On start stage, just show the message and
        //handle player action to start the game
        gameObj.log('All Ready! Press space, enter or click the mouse to start!');
        if (playerAction)
          gameObj.stage = 'play';
      }
      else if (gameObj.stage === 'pause'){
        //On pause stage, just show the message and
        //handle player action to resume the game
        gameObj.log('Game paused! Press space, enter or click the mouse to resume!');
        if (playerAction)
          gameObj.stage = 'play';
      }
      else if (gameObj.stage === 'gameover'){
        //On gameover stage, just show the message and
        //handle player action to restart the game
        gameObj.log('Game over! Press space, enter or click the mouse to play again!');
        if (playerAction){
          //reset round data
          gameObj.startRound();
          gameObj.stage = 'play';
        }
      }
      else{
        //On play stage, show the pause message,
        //handle pause action and all game events
        gameObj.log('Press P to pause!');
        var _player = gameObj.player;
        //check for player action
        if (playerAction){
          //set negative gravity to make the bird jump up
          _player.gravity = gameObj.defaults.player.gravity - gameObj.gamePhysics.jumpGravity;
        }else if (gameObj.inputData.keyPressed === 112){
          //handle P key to pause the game
          gameObj.stage = 'pause';
        }
        else if(_player.gravity !== gameObj.defaults.player.gravity){
           //gradually restore the original gravity
          _player.gravity += gameObj.gamePhysics.jumpGravity / gameObj.gamePhysics.jumpLoops;
        }
        //Apply gravity
        _player.y += _player.gravity;
        //Wing up and down
        gameObj.player.frameCount = gameObj.player.frameCount || 0;
        gameObj.player.frameCount = gameObj.player.frameCount === 5 ? 0 : gameObj.player.frameCount + 1;
        if (!gameObj.player.frameCount)
          gameObj.player.wingUp = !gameObj.player.wingUp;
        //Move all tree pairs
        for (var i = 0; i < gameObj.treePairs.length; i++){
          var treePair = gameObj.treePairs[i];
          //Move the tree
          treePair.x -= gameObj.gamePhysics.treeSpeed;
          //Check if tree is already gone
          if (treePair.x < gameObj.treeSize.width * -1){
            //Remove tree from array
            gameObj.treePairs.splice(i, 1);
            //Replace the deleted tree with new one on the end of the quere
            gameObj.treePairs.push(gameObj.createRandomTreePair());
            //Sum one point to the player
            gameObj.player.points++;
          }
        }
        //Check for gameover
        if (gameObj.hasLost()){
          gameObj.stage = 'gameover';
        }
      }
      //Clear input data
      gameObj.inputData.clear();
    },
    hasLost: function(){
      //Check if the bird has hit the ground or if there was any collision with trees
      return (gameObj.player.y > (gameObj.gameSize.height - gameObj.player.size.height))
              || gameObj.checkTreeCollision();
    },
    checkTreeCollision: function(){
      for (var i = 0; i < gameObj.treePairs.length; i++){
        //For every tree, check if the collision data is set
        //and if so, if any of them collides with the bird
        var treePair = gameObj.treePairs[i];
        if (treePair.collisions && treePair.collisions.some(function(item){
          return util.checkBoxCollision({
            x: gameObj.player.x,
            y: gameObj.player.y,
            w: gameObj.player.size.width,
            h: gameObj.player.size.height
          }, item);
        })) return true;
      }
      return false;
    },
    render: function(){
      //Clear buffer canvas
      util.clearCanvas(gameObj.bufferCanvas);
      //Render background
      var ctx = gameObj.bufferCanvas.getContext('2d');
      var bgRes = gameObj.resources.sky;
      ctx.drawImage(bgRes, 0, 0, bgRes.width, bgRes.height, 0, 0, gameObj.gameSize.width, gameObj.gameSize.height);
      //Render all tree pairs
      for (var i = 0; i < gameObj.treePairs.length; i++)
        gameObj.drawTreePair(gameObj.treePairs[i]);
      //Render bird
      gameObj.player.renderToCanvas();
      //Render points
      document.getElementById('pontos').innerText = 'Score: ' + gameObj.player.points + ' point(s).';
      //Transfer buffer image data to game canvas
      //This avoid the main canvas to blink when updating
      util.transferCanvas(gameObj.bufferCanvas, gameObj.gameCanvas);
    },
    drawTreePair: function(treePair){
      var ctx = gameObj.bufferCanvas.getContext('2d');
      //Determine the upper tree bottom and de down tree top position
      var upCorner = treePair.y * gameObj.gameSize.height / 100;
      var downCorner = upCorner + gameObj.player.size.height * 3;
      //Calculate the y coord for both trees
      var treeDownY = upCorner - gameObj.treeSize.height;
      var treeUpY = downCorner;
      //Set collision data for this tree pair
      treePair.collisions = [{x: treePair.x, y: treeDownY, w: gameObj.treeSize.width, h: gameObj.treeSize.height},
                              {x: treePair.x, y: treeUpY, w: gameObj.treeSize.width, h: gameObj.treeSize.height}];
      //Draw the tree pair rects
      ctx.fillStyle = 'brown';
      ctx.fillRect(treePair.x, treeDownY, gameObj.treeSize.width, gameObj.treeSize.height);
      ctx.fillRect(treePair.x, treeUpY, gameObj.treeSize.width, gameObj.treeSize.height);
    }
  };

  return gameObj;
})(_imageLoader, _util);
