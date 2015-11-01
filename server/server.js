var connect = require('connect');
var serveStatic = require('serve-static');
var path = require('path');
var port = 8080;

connect().use(serveStatic(path.join(__dirname, '..'))).listen(port, function(){
  console.log('Servidor rodando na porta ' + port + '.');
});
