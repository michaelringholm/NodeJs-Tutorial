//const express = require('express');
//const app = new express();
var http = require('http');
var fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');
const uuidv1 = require('uuid');
const formidable = require('formidable')
const authenticator = require('authenticator')
const QRCode = require(`qrcode`)

var port = process.env.PORT || 8080;
var fileUploadInProgress = false;
var validToken = "";
var azBlobStoreFacade = new AZBlobStoreFacade();
var htmlFacade = new HTMLFacade();
var fileFacade = new FileFacade();

function FileFacade() {
  var _this = this;

  this.createFolder = async function(folder) {    
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }
  }

  var readNextChunk = function(buffer, fd, err) {
    fs.read(fd, buffer, 0, CHUNK_SIZE, null, function(err, nread) {
      if (err) throw err;

      if (nread === 0) {
        // done reading file, do any necessary finalization steps

        fs.close(fd, function(err) {
          if (err) throw err;
        });
        return;
      }

      var data;
      if (nread < CHUNK_SIZE)
        data = buffer.slice(0, nread);
      else
        data = buffer;

      // do something with `data`, then call `readNextChunk();`
    });
  }

  this.readFileChunks = function(filePath) {
    var CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    var buffer = Buffer.alloc(CHUNK_SIZE);

    fs.open(filePath, 'r', function(err, fd) {
      if (err) throw err;
      readNextChunk(buffer, fd, err);
    });  
  };

  this.readStream = function(filePath, outputStream) {
    var readStream = fs.createReadStream(filePath);

    // This will wait until we know the readable stream is actually valid before piping
    readStream.on('open', function () {
      // This just pipes the read stream to the response object (which goes to the client)
      readStream.pipe(outputStream);
    });
  
    // This catches any errors that happen while creating the readable stream (usually invalid names)
    readStream.on('error', function(err) {
      outputStream.end(err);
    });
  };

}

function AZBlobStoreFacade() {
  var _this = this;
  var AZURE_STORAGE_CONNECTION_STRING;

  this.beginFileUploadAsync = async function (request, response, callback) {
    fileUploadInProgress = true;

    var form = new formidable.IncomingForm();
    form.maxFileSize = 8*1024*1024*1024;
    form.parse(request, async function(err, fields, files) {
      console.log("parsing form...");
      for(var fileIndex in files) {
        var file = files[fileIndex];
        await _this.uploadBlobAsync(file.path, file.name);
      }
      if(callback) callback(response, file.path);
    });
  };

  this.beginDownloadAsync = async function (request, response, callback) {
    fileUploadInProgress = true;

    /*var form = new formidable.IncomingForm();
    form.maxFileSize = 8*1024*1024*1024;
    form.parse(request, async function(err, fields, files) {
      console.log("parsing form...");
      var blobName = fields.blobName;
      var blobInfo = await _this.downloadBlobAsync(blobName);
      if(callback) callback(blobInfo);
    });*/    
    var routePrefix = "download-file/";
    var decodedUrl = decodeURI(request.url);
    var urlStartIndex = decodedUrl.indexOf(routePrefix)
    var blobName = decodedUrl.substring(urlStartIndex + routePrefix.length);
    var blobInfo = await _this.downloadBlobAsync(blobName);
    if(callback) callback(blobInfo);
  };  

  this.uploadBlobAsync = async function (localFilePath, originalFileName) {    
    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    //const containerName = 'quickstart' + uuidv1();
    var containerName = "backup";

    console.log('\nCreating container...');
    console.log('\t', containerName);

    var containerClient = blobServiceClient.getContainerClient(containerName);
    var blobName = originalFileName; //uuidv1();
    var blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log('Uploading blob to Azure storage with name: ', blobName);

    // Upload data to the blob
    //var data = 'Hello, World!';
    //var test = blockBlobClient.uploadFile(localFilePath);
    var uploadBlobResponse = await blockBlobClient.uploadFile(localFilePath);
    //var uploadBlobResponse = await blockBlobClient.uploadBlobResponse(data, data.length);
    console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
    fileUploadInProgress = false;
  };

  this.downloadBlobAsync = async function (blobName) {    
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    var containerName = "backup";
    var containerClient = blobServiceClient.getContainerClient(containerName);
    var blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log('Downloading blob from Azure storage with name: ', blobName);
    var localFilePath = "./tmp/" + uuidv1();
    await fileFacade.createFolder("./tmp");
    var response = await blockBlobClient.downloadToFile(localFilePath,0);
    console.log("Blob " + blobName + "was downloaded successfully to local file path " + localFilePath + ".");
    return { blobName: blobName, localFilePath: localFilePath };    
  }; 

  this.streamBlobAsync = async function(blobName, outputStream, onEndCallback) {    
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    var containerName = "backup";
    var containerClient = blobServiceClient.getContainerClient(containerName);
    var blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log('Streaming blob to output stream, blob is: ', blobName);
    
    var stream = await blockBlobClient.download();
    stream.readableStreamBody.pipe(outputStream);
    if(onEndCallback) stream.readableStreamBody.on("end", onEndCallback);
  };  

  this.getBlobListAsync = async function() {    
    // Create a unique name for the blob
    var AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    AZURE_STORAGE_CONNECTION_STRING=process.env["AZURE_STORAGE_CONNECTION_STRING"];
    console.log("AZURE_STORAGE_CONNECTION_STRING="+AZURE_STORAGE_CONNECTION_STRING);
    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    // Create a unique name for the container
    //const containerName = 'quickstart' + uuidv1();
    var containerName = "backup";

    console.log('\nCreating container...');
    console.log('\t', containerName);

    var containerClient = blobServiceClient.getContainerClient(containerName);
    var blobList = new Array();
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log("Blob ${i++}: ${blob.name}");
      blobList.push(blob);
    }
    console.log('\nBlob List:\n\t', blobList);
    return blobList;
  };

  var construct = function() {
    AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    AZURE_STORAGE_CONNECTION_STRING=process.env["AZURE_STORAGE_CONNECTION_STRING"];
    console.log("AZURE_STORAGE_CONNECTION_STRING="+AZURE_STORAGE_CONNECTION_STRING);
  };

  construct();
}

function HTMLFacade() {
  var _this = this;

  this.setHtmlValue = function(html, tag, value) {
    if(value == undefined) return html;
    html = html.toString().replace(new RegExp(tag, 'g'), value);
    return html;
  };

  this.getCookieValue = function(cookie, key) {
    if(cookie == undefined || cookie.length == 0)
      return null;
    const COOKIE_AUTH_KEY="Authorization=";
    var tokenStart = cookie.indexOf(COOKIE_AUTH_KEY);
    var token = cookie.substring(tokenStart+COOKIE_AUTH_KEY.length);
    var tokenEnd = token.indexOf(";");
    if(tokenEnd > 0)
      token = token.substring(0, tokenEnd);
    token = token.replace("Bearer", "").trim();
    return token;
  };

  this.parseHtml = function(html, model) {
    var parsedHtml = html;
    for(var key in model) {
      console.log("key="+key);
      console.log("value=" +model[key]);
    }
    //parsedHtml = _this.setHtmlValue(parsedHtml, "{fileUploadInProgress}", fileUploadInProgress);
    /*parsedHtml = _this.setHtmlValue(parsedHtml, "{squidSubStatus}", squidSubStatus);
    parsedHtml = _this.setHtmlValue(parsedHtml, "{squidStatus}", squidStatus);
    parsedHtml = _this.setHtmlValue(parsedHtml, "{openPortsLog}", openPortsLog);
    parsedHtml = _this.setHtmlValue(parsedHtml, "{cpuLog}", cpuLog);
    parsedHtml = _this.setHtmlValue(parsedHtml, "{url}", url);*/
    return parsedHtml;
  };

  this.writeFile = function(response, fileName, filePath, bearerToken) {
    if(bearerToken)
      response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename='+fileName, "Authorization": bearerToken });
    else
      response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename='+fileName });

    fs.readFile(filePath, null, function (error, file) {
      if (error) {
        response.writeHead(404);
        response.write('file not found');
      } 
      else {
        response.write(file);
      }
      response.end();      
    });
  };
  
  this.writeCss = function(response, cssPath) {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    fs.readFile('./static/' + cssPath, null, function (error, css) {
      if (error) {
        response.writeHead(404);
        response.write('file not found');
      } 
      else {
        response.write(css);
      }
      response.end();      
    });
  };

  this.writeJs = function(response, jsPath) {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    fs.readFile('./static/' + jsPath, null, function (error, js) {
      if (error) {
        response.writeHead(404);
        response.write('file not found');
      } 
      else {
        response.write(js);
      }
      response.end();      
    });
  };

  this.writeJson = function(response, statusCode, responseData, bearerToken) {
    if(bearerToken)
      response.writeHead(statusCode, { 'Content-Type': 'application/json', "Authorization": bearerToken });
    else
      response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    
    var jsonResponse = JSON.stringify(responseData);
    response.write(jsonResponse);
    response.end();
  };  
  
  this.writeHtmlPage = function(response, pagePath, model, bearerToken) {
    if(bearerToken)
      response.writeHead(200, { 'Content-Type': 'text/html', "Authorization": bearerToken });
    else
      response.writeHead(200, { 'Content-Type': 'text/html' });
  
    fs.readFile(pagePath, null, function (error, html) {
      if (error) {
        response.writeHead(404);
        response.write('file not found');
      } else {
        response.write(_this.parseHtml(html, model));
      }
      response.end();
    });
  };

  this.getRequestData = function(request, response, callback) {  
    if(request.headers['content-type'].startsWith("application/json")) {
      var jsonPayload = "";
      request.on('data', chunk => {      
        jsonPayload += chunk.toString();
      });
      request.on('end', async() => {
          var payload = JSON.parse(jsonPayload);
          console.log("jsonPayload="+jsonPayload);
          if(callback) callback(response, payload);
      });
    }
  };  

}


async function processRequest(request, response) {
  //var filePath = "github - Copy - Copy.rar";
  var filePath = "server.zip";
  response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename='+filePath });
  azBlobStoreFacade.streamBlobAsync(filePath, response, function() {
    response.end();
  });
};

async function run() {
  console.log("run() called");
  //fileFacade.readStream();
 

  var server = http.createServer(processRequest);
  server.timeout = 600*1000;
  server.listen(port);  
}

console.log("Sandbox started");
run();
console.log("Sandbox ended");
