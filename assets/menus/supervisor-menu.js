// imports inquirer npm, creates prompt
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

// imports Table constructor from cli-table npm
let Table = require('cli-table');

// imports custom module. bamazonDB is for back-end database mng.
const bamazonDB = require('../db-mng/bamazon-db-mng.js');

// supervisorMenu object, to be exported as a module
const supervisorMenu = {
	// initialization method for supervisorMenu -- 
	// checks if Bamazon server connection can be established before proceeding.
	initialize: function() {
		// attempts connection to mysql server. if it fails, program ends.
		// else, goes to supervisorMenu.main()
		bamazonDB.connect().then(function(connectMsg){
			// proceeds to supervisorMenu.main() if connection is successful
			console.log('\n' + connectMsg + 
				'\n\n*************** Welcome to Bamazon Supervisor Interface ***************\n');
			return supervisorMenu.main();
		}).catch(function(errMsg){
			return console.log(errMsg);
		});
	}, // end of supervisorMenu.intitialize()

	// main menu function
	main: function() {

		console.log('\n======= MAIN MENU =======\n');

		prompt([
		{
			type: 'list',
			message: 'What can I help you with today?',
			choices: [
				'View Product Sales by Department',
				'Create New Department',
				'Quit'
			],
			name: 'mainMenuChoice'
		}
		]).then(function(answers){
			switch (answers.mainMenuChoice) {
				case 'View Product Sales by Department':
					supervisorMenu.main();
					break;
				case 'Create New Department':
					supervisorMenu.main();
					break;
				case 'Quit':
					supervisorMenu.quit();
					break;
			}
			return;
		});
	}, // end of supervisorMenu.main()
	quit: function() {
		// handles promise returned from bamazonDB.quit()
		bamazonDB.quit().then(function(){
			return console.log('\nThank you for using the Bamazon Supervisor Interface. Good bye...\n');
		}).catch(function(errMsg){
			return console.log(errMsg);
		});
	} // end of supervisorMenu.quit()
	
}; // end of supervisorMenu object

module.exports = supervisorMenu;