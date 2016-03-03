var http = require('http');
var fs = require('fs');

function saveFile(customData) {
	var fs = require("fs");

	console.log("Going to write into existing file");
	var updateTime = new Date();
	fs.writeFile('save.dat', '{ "map" : "general", "position": "10,25", "updateTime" : "' + updateTime + '", "customData" : "' + customData + '" }',  function(err) {
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
		if (request.method == 'POST') {
			var fullBody = '';
    
			request.on('data', function(chunk) {
			  // append the current chunk of data to the fullBody variable
			  fullBody += chunk.toString();
			});
			
			request.on('end', function() {			
				// request ended -> do something with the data
				saveFile(fullBody);
				response.write('{ "status": "success"}');
				response.end();
			});
		}
		else {
			saveFile();
			response.write('{ "status": "success"}');
			response.end();
		}
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

/*
if (req.method == 'POST') {
    console.log("[200] " + req.method + " to " + req.url);
    var fullBody = '';
    
    req.on('data', function(chunk) {
      // append the current chunk of data to the fullBody variable
      fullBody += chunk.toString();
    });
    
    req.on('end', function() {
    
      // request ended -> do something with the data
      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
      
      // parse the received body data
      var decodedBody = querystring.parse(fullBody);

      // output the decoded data to the HTTP response          
      res.write('<html><head><title>Post data</title></head><body><pre>');
      res.write(utils.inspect(decodedBody));
      res.write('</pre></body></html>');
      
      res.end();
    });
    
  }
  */