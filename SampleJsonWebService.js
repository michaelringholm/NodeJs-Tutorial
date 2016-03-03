var http = require('http');
var fs = require('fs');

function saveFile() {
	var fs = require("fs");

	console.log("Going to write into existing file");
	var updateTime = new Date();
	fs.writeFile('save.dat', '{ "map" : "general", "position": "10,25", "updateTime" : "' + updateTime + '" }',  function(err) {
	if (err) {
		return console.error(err);
	}
	console.log("Data written successfully!");
});
}

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  console.log(request.url);
  
  if(request.url == "/about") {
	response.write('{"author": "Michael Sundgaard", "company" : "Opus Magus"}');
	response.end();
  }
  if(request.url == "/save") {	
		saveFile();
		response.write('{ "status": "success"}');
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