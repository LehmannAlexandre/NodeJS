// Serveur deconnecte


var http = require('http');
var util = require("util");
var url = require("url");

var router = require("./router.js");

var serv = {};

serv.port = 1337;
serv.ip = "127.0.0.1";

serv.cs = function(req, res) {
	router.run_req(req, res);
};

http.createServer(serv.cs).listen(serv.port, serv.ip);

util.log('Server running at http://' + serv.ip + ':' + serv.port + '/');

