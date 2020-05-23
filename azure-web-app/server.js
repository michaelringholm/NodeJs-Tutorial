//const express = require('express');
//const app = new express();
var http = require('http');
var fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');
const uuidv1 = require('uuid/v1');
const formidable = require('formidable')

var port = process.env.PORT || 8080;
var fileUploadInProgress = false;
var validToken = "";

async function beginFileUpload(request, response, callback) {
  fileUploadInProgress = true;

  var form = new formidable.IncomingForm();
  form.parse(request, async function(err, fields, files) {
    console.log("parsing form...");
    for(var fileIndex in files) {
      var file = files[fileIndex];
      await uploadBlobAsync(file.path, file.name);
    }
    if(callback) callback(response, file.path);
  });


  //const FORM_URLENCODED = 'application/x-www-form-urlencoded';
  
  /*const FORM_MULTIPART = 'multipart';
  if(request.headers['content-type'].startsWith(FORM_MULTIPART)) {
      var localFilePath = "temp/" + uuidv1();
      //var stream = fs.createWriteStream(localFilePath);
      request.on('data', chunk => {
        fs.appendFileSync(localFilePath, chunk);
          //stream.write(chunk);
          //body += chunk.toString();
      });
      request.on('end', async() => {          
          //await uploadBlobAsync(localFilePath);
          console.log("file written " + localFilePath);
          if(callback) callback(response, localFilePath);
      });
  }
  else if(callback) callback();  */
}

function getPayloadData(request, response, callback) {  
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
}

async function uploadBlobAsync(localFilePath, originalFileName) {    
    // Create a unique name for the blob
    var AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    AZURE_STORAGE_CONNECTION_STRING=process.env["AZURE_STORAGE_CONNECTION_STRING"];
    console.log("AZURE_STORAGE_CONNECTION_STRING="+AZURE_STORAGE_CONNECTION_STRING);
    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    //const containerName = 'quickstart' + uuidv1();
    var containerName = "backup";

    console.log('\nCreating container...');
    console.log('\t', containerName);

    var containerClient = blobServiceClient.getContainerClient(containerName);
    var blobName = originalFileName; //uuidv1();
    var blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log('\nUploading to Azure storage as blob:\n\t', blobName);

    // Upload data to the blob
    //var data = 'Hello, World!';
    //var test = blockBlobClient.uploadFile(localFilePath);
    var uploadBlobResponse = await blockBlobClient.uploadFile(localFilePath);
    //var uploadBlobResponse = await blockBlobClient.uploadBlobResponse(data, data.length);
    console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
    fileUploadInProgress = false;
}

async function getBlobListAsync() {    
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
}

function setHtmlValue(html, tag, value) {
    if(value == undefined) return html;
    html = html.toString().replace(new RegExp(tag, 'g'), value);
    return html;
}

function parseHtml(html) {
    var parsedHtml = html;
    //parsedHtml = setHtmlValue(parsedHtml, "{fileUploadInProgress}", fileUploadInProgress);
    /*parsedHtml = setHtmlValue(parsedHtml, "{squidSubStatus}", squidSubStatus);
    parsedHtml = setHtmlValue(parsedHtml, "{squidStatus}", squidStatus);
    parsedHtml = setHtmlValue(parsedHtml, "{openPortsLog}", openPortsLog);
    parsedHtml = setHtmlValue(parsedHtml, "{cpuLog}", cpuLog);
    parsedHtml = setHtmlValue(parsedHtml, "{url}", url);*/
    return parsedHtml;
  }
  
  function writeCss(response, cssPath) {
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
  }

  function writeJs(response, jsPath) {
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
  }  
  
  function writeHtmlPage(response, pagePath, bearerToken) {
    if(bearerToken)
      response.writeHead(200, { 'Content-Type': 'text/html', "Authorization": bearerToken });
    else
      response.writeHead(200, { 'Content-Type': 'text/html' });
  
    fs.readFile(pagePath, null, function (error, html) {
      if (error) {
        response.writeHead(404);
        response.write('file not found');
      } else {
        response.write(parseHtml(html));
      }
      response.end();
    });
  }

function writeJson(response, statusCode, responseData, bearerToken) {
  if(bearerToken)
    response.writeHead(statusCode, { 'Content-Type': 'application/json', "Authorization": bearerToken });
  else
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  
  var jsonResponse = JSON.stringify(responseData);
  response.write(jsonResponse);
  response.end();
}

function uploadComplete(response, localFilePath) {
  //writeHtmlPage(response, './static/html/index.html');
  writeJson(response, 200, { "message" : "Upload completed." }, "Bearer " + validToken);
}

function login(response, payload) {
  console.log("trying to log in...");
  var passwords = fs.readFileSync("local/passwords");
  if(payload.password == passwords.toString()) {
      console.log("password accepted.");
      validToken = uuidv1();
      writeJson(response, 200, { "Message" : "Login successful" }, "Bearer " + validToken);
      return;
  }
  console.log("login failed.");
  writeJson(response, 401, { "Message": "Invalid login or password" });
}

function getCookieValue(cookie, key) {
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
}

http.createServer(async function (request, response) {
    console.log("function triggered by URL " + request.url);
    if(request.url.startsWith("/css/")) writeCss(response, request.url);
    else if(request.url.startsWith("/js/")) writeJs(response, request.url);
    else if(request.url.startsWith("/login")) {
      getPayloadData(request, response, login);      
    }
    else {
      // ***** Authorized section ******
      var token = request.headers.authorization;
      if(token == undefined)
        token = getCookieValue(request.headers.cookie, "Authorization");
      if(token == undefined) {
        console.log("No token found in headers!");
        writeHtmlPage(response, './static/html/login.html');
        return;
      }
      else {
        if(token != validToken) {
          console.log("Token invalid or expired!");
          writeHtmlPage(response, './static/html/login.html');
          return;
        }
        // When authorized check the wanted URL    
      if(request.url.startsWith("/upload")) {
        await beginFileUpload(request, response, uploadComplete);
      }
      else if(request.url.startsWith("/list-files")) {
        var blobList = await getBlobListAsync();
        writeJson(response, 200, { "message" : "Here is the blob list...", "blobList": blobList }, "Bearer " + validToken);
      }
      else if(request.url.startsWith("/index")) writeHtmlPage(response, './static/html/index.html');
      else writeHtmlPage(response, './static/html/index.html');
    }
  }
    
    /*res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write("<form method=\"post\" action=\"/upload\" enctype=\"multipart/form-data\">");
    res.write("<input type=\"file\" id=\"fileToUpload\"></input>");
    res.write("<input type=\"submit\" value=\"Upload\"></input>");
    res.write("</form>");
    res.end('iHedge Blob Uploader');*/
    
}).listen(port);

/*app.get('/', function(request, response){
    response.sendFile(process.cwd()+'/static/index.html');
});

app.listen(port);*/

console.log('Your application is listening on port ' + port);
console.log('http://localhost:' + port);
