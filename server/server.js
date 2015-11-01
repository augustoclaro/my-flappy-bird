var connect = require('connect');
var serveStatic = require('serve-static');
var path = "C:\\pessoais\\flappy";
var port = 8080;

connect().use(serveStatic(path)).listen(port, function(){
  console.log("Servidor rodando na porta " + port + ".");
});
