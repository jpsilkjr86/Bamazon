var mysql = require('mysql');
var keys = require('./keys.js');
var inquirer = require('inquirer');
var prompt = inquirer.createPromptModule();

var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: keys.pw.mysqlpw,
	database: 'bamazon'
});

console.log('password retrieval status: ' + keys.pw.status);

connection.connect(function(err) {
	if (err) {
		console.log('error connecting: ' + err.stack);
		return;
	}

	console.log('connected as id ' + connection.threadId);

	connection.end();
});