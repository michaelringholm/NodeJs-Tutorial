var http = require('http');
var fs = require('fs');

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  console.log(request.url);
  
  if(request.url == "/about") {
	response.write('{"author": "Michael Sundgaard", "company" : "Opus Magus"}');
	response.end();
  }
  else {
	fs.readFile('save.dat', (err, data) => {		
		if (err) throw err;
		response.write(data);
		response.end();
	});
  }
}).listen(1337, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1337/');