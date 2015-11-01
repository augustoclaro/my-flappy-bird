var _imageLoader = (function(){
  var _results = {};
  var _loadImages = function(images, cb){
    for (var key in images){
      var img = new Image();
      img.alt = key;
      img.onload = function(){
        _results[this.alt] = this;
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
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
    transferCanvas: function(canvasFrom, canvasTo){
      var sourceContext = canvasFrom.getContext('2d');
      var destContext = canvasTo.getContext('2d');

      var imgData = sourceContext.getImageData(0, 0, canvasFrom.width, canvasFrom.height);
      destContext.putImageData(imgData, 0, 0, 0, 0, canvasFrom.width, canvasFrom.height);
    },
    random: function(min, max){
       return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    checkBoxCollision: function(box1, box2, lax){
      //margin of error of collision
      // lax = lax || 0;
      lax = 0;
      return box1.x - lax < box2.x + box2.w && //onde o player começa menor que onde o item termina - horizontal
              box1.x + box1.w - lax > box2.x && //onde o player termina maior que onde o item começa - horizontal
              box1.y + lax < box2.y + box2.h && //onde o player começa menor que onde o item termina - vertical
              box1.y + box1.h + lax > box2.y; //onde o player termina maior que onde o item começa - vertical
    }
  };
})();

var flapGame = (function(imageLoader, util){
  var gameObj = {
    defaults: {
      player: {
        x: 50,
        y: 50,
        gravity: 17
      }
    },
    stage: 'start',
    log: function(msg){
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
        // var birdRes = gameObj.resources.bird;
        // ctx.drawImage(birdRes, 0, 0, birdRes.width, birdRes.height, gameObj.player.x, gameObj.player.y, gameObj.player.size.width, gameObj.player.size.height);
        ctx.fillStyle = 'red';
        //Draw bird's body
        ctx.fillRect(gameObj.player.x, gameObj.player.y, gameObj.player.size.width, gameObj.player.size.height);
        ctx.fillStyle = 'yellow';
        //Draw bird's beak
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
      jumpGravity: 30,
      jumpLoops: 10,
      treeDistance: 350
    },
    createRandomTreePair: function(){
      return {
        x: gameObj.treePairs.length
                    ? (gameObj.treePairs[gameObj.treePairs.length - 1].x + gameObj.gamePhysics.treeDistance)
                    : gameObj.gameSize.width,
        y: util.random(20, 60)
      };
    },
    FPS: 20,
    gameSize: {
      width: 800,
      height: 600
    },
    gameLoop: undefined,
    gameCanvas: undefined,
    bufferCanvas: undefined,
    treeSize: undefined,
    treePairs: undefined,
    resources: {
      // bird: '/img/bird.png',
      sky: '/img/sky.png',
      treeDown: '/img/tree-down.png',
      treeUp: '/img/tree-up.png'
    },
    createCanvas: function(){
      var el = document.createElement('canvas');
      el.setAttribute('width', gameObj.gameSize.width);
      el.setAttribute('height', gameObj.gameSize.height);
      return el;
    },
    detectInput: function(){
      document.onkeypress = function(e){
        var key = e.keyCode || e.which;
        gameObj.inputData.keyPressed = key;
      };

      gameObj.gameCanvas.onclick = function(){
        gameObj.inputData.mouseClick = 1;
      };
    },
    startRound: function(){
      gameObj.treePairs = [];
      //Set player data
      gameObj.player.x = gameObj.defaults.player.x;
      gameObj.player.y = gameObj.defaults.player.y;
      gameObj.player.gravity = gameObj.defaults.player.gravity;
      gameObj.player.points = 0;
      //Generate starting trees
      for (var i = 1; i <= 5; i++)
        gameObj.treePairs.push(gameObj.createRandomTreePair())
    },
    init: function(parentElId){
      window.onload = function(){
        gameObj.log('Iniciando jogo e carregando objetos.');
        //Create game and buffer canvas. Set game canvas ID and append to parent elementgameObj
        gameObj.gameCanvas = gameObj.createCanvas();
        gameObj.bufferCanvas = gameObj.createCanvas();
        gameObj.gameCanvas.setAttribute('id', 'gameCanvas');
        var parentEl = document.getElementById(parentElId);
        parentEl.appendChild(gameObj.gameCanvas);
        gameObj.startRound();
        //Load resources
        imageLoader.loadImages(gameObj.resources, function(loadedResources){
          gameObj.resources = loadedResources;
          //Set tree size
          var resizeFactor = 1.5;
          gameObj.treeSize = {
            width: gameObj.resources.treeDown.width / resizeFactor,
            height: gameObj.resources.treeDown.height / resizeFactor
          };
          //Start browser event handlers
          gameObj.detectInput();
          gameObj.startGameLoop();
        });
      };
    },
    startGameLoop: function(){
      gameObj.gameLoop = setInterval(gameObj.loopAction, 1000 / gameObj.FPS)
    },
    loopAction: function(){
      gameObj.update();
      gameObj.render();
    },
    update: function(){
      var playerAction = gameObj.inputData.keyPressed === 32 ||
          gameObj.inputData.keyPressed === 13 ||
          gameObj.inputData.mouseClick === 1;

      if (gameObj.stage === 'start'){
        gameObj.log('Pronto! Aperte espaço, enter, ou clique com o mouse para começar!');
        if (playerAction)
          gameObj.stage = 'play';
      }
      else if (gameObj.stage === 'pause'){
        gameObj.log('Jogo pausado! Aperte espaço, enter, ou clique com o mouse para continuar!');
        if (playerAction)
          gameObj.stage = 'play';
      }
      else if (gameObj.stage === 'gameover'){
        gameObj.log('Fim de jogo! Aperte espaço, enter, ou clique com o mouse para jogar novamente.');
        if (playerAction){
          gameObj.startRound();
          gameObj.stage = 'play';
        }
      }
      else{
        gameObj.log('Pressione P para pausar!');
        var _player = gameObj.player;
        //check for player action
        if (playerAction){
          //set reverse gravity to make the bird jump up
          _player.gravity = gameObj.defaults.player.gravity - gameObj.gamePhysics.jumpGravity;
        }else if (gameObj.inputData.keyPressed === 112){;
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
          treePair.x -= 10;

          if (treePair.x < gameObj.treeSize.width * -1){
            gameObj.treePairs.splice(i, 1);
            gameObj.treePairs.push(gameObj.createRandomTreePair());
            gameObj.player.points++;
          }
        }

        if (gameObj.hasLost()){
          gameObj.stage = 'gameover';
        }
      }

      gameObj.inputData.clear();
    },
    hasLost: function(){
      return (gameObj.player.y > (gameObj.gameSize.height - gameObj.player.size.height))
              || gameObj.checkTreeCollision();
    },
    checkTreeCollision: function(){
      for (var i = 0; i < gameObj.treePairs.length; i++){
        var treePair = gameObj.treePairs[i];
        if (treePair.collisions && treePair.collisions.some(function(item){
          return util.checkBoxCollision({
            x: gameObj.player.x,
            y: gameObj.player.y,
            w: gameObj.player.size.width,
            h: gameObj.player.size.height
          }, item, 0);
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
      document.getElementById('pontos').innerText = 'Pontuação: ' + gameObj.player.points + ' ponto(s).';
      //Transfer buffer image data to game canvas
      util.transferCanvas(gameObj.bufferCanvas, gameObj.gameCanvas);
    },
    drawTreePair: function(treePair){
      var ctx = gameObj.bufferCanvas.getContext('2d');
      var treeDownRes = gameObj.resources.treeDown;
      var treeUpRes = gameObj.resources.treeUp;
      var resizeFactor = 1.5;

      var upCorner = treePair.y * gameObj.gameSize.height / 100;
      var downCorner = upCorner + gameObj.player.size.height * 3;

      var treeDownY = upCorner - gameObj.treeSize.height;
      var treeUpY = downCorner;

      treePair.collisions = [{x: treePair.x, y: treeDownY, w: gameObj.treeSize.width, h: gameObj.treeSize.height},
                              {x: treePair.x, y: treeUpY, w: gameObj.treeSize.width, h: gameObj.treeSize.height}];

      ctx.drawImage(treeDownRes, 0, 0, treeDownRes.width, treeDownRes.height, treePair.x, treeDownY, gameObj.treeSize.width, gameObj.treeSize.height);
      ctx.drawImage(treeUpRes, 0, 0, treeUpRes.width, treeUpRes.height, treePair.x, treeUpY, gameObj.treeSize.width, gameObj.treeSize.height);
      ctx.fillStyle = 'brown';
      ctx.fillRect(treePair.x,treeDownY,gameObj.treeSize.width,gameObj.treeSize.height);
      ctx.fillRect(treePair.x,treeUpY,gameObj.treeSize.width,gameObj.treeSize.height);
    }
  };

  return gameObj;
})(_imageLoader, _util);
