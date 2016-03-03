var http = require('http');

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  
  response.write('<html>');
  response.write('<body>');
  response.write('<h1>Page is hosted by NodeJs Web Server</h1>');
  response.write('<div>This is the main div of the page.</div>');    
  response.write('</body>');
  response.write('</html>');
  response.end();
}).listen(1337, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1337/');