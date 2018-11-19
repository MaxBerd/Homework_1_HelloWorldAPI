/*
* Server code and route handlers
* Homework Assignment #1 
* Author: MaxBerd
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./config');

//Instantiate the HTTP Server
let httpServer = http.createServer(function(req, res){
    //Passing req and res to unifiedServer function
    unifiedServer(req, res);
});

//Start HTTP server
httpServer.listen(config.httpPort, function(){
    console.log("HTTP Server Successfuly started in " + config.envName.toUpperCase() + " environment on port " + config.httpPort);
});
 
//Instantiate HTTPS Server
let httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem'),
};
let httpsServer = https.createServer(httpsServerOptions,function(req, res){
    unifiedServer(req, res);
});
 
//Start HTTPS Server
httpsServer.listen(config.httpsPort, function(){
    console.log("HTTPS Server Successfuly started in " + config.envName.toUpperCase() + " environment on port " + config.httpsPort);
});



//Define Handlers
let handlers = {};

// Define hello Handler
handlers.hello = function(data, callback) {
//Define hello response object
let helloObject = {
    'message' : "Hello world",
};
    callback(200, helloObject);
};

//Define Not Found (Default) handler
handlers.notFound = function(data, callback) {
//Define NotFound object
let notFoundObject = {
    'message' : "Page " + data.trimmedPath + " is not available",
};
//Callback status code and Not found response object
    callback(404, notFoundObject);
}; 


//Define a request router
let router = {
    'hello' : handlers.hello
};

//All the server logic for http and https servers
let unifiedServer = function(req, res) {
    //Get the URL and parse it
    let parsedUrl = url.parse(req.url, true )
    //Get the path
    let path = parsedUrl.pathname; 
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
    //Get the query sting as an object
    let queryStringObject = parsedUrl.query;
   
    //Get the HTTP Method
    let method =req.method.toLowerCase();
   
    //Get the headers as an object
    let headers = req.headers;
   
    //Get the Payloads, if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';
   
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();
   
        /*Chose the handler this request should go
        If one is not found, it should go to notFound handler*/
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
   
        //Construct the Data obj to send to the handler
            let data = {
                'trimmedPath' : trimmedPath,
                'queryStringObject' : queryStringObject,
                'method' : method,
                'headers' : headers,
                'payload': buffer
            };
   
        //Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            //Use the payload called back by the handler, or by default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};
   
            //Convert the payload from the object to the string
            let payloadString = JSON.stringify(payload);
            
            //Return the response
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
            //Log the response
            console.log("Returnig Response: ", statusCode, payload);
        });
   
        //Send the response
   
   
    });
   };