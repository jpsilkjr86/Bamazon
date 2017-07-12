// imports inquirer npm, creates prompt
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

// imports Table constructor from cli-table npm
let Table = require('cli-table');

// imports custom modules. bamazonDB for back-end database mng,
// BamazonOrder for constructor of new orders
const bamazonDB = require('../db-mng/bamazon-db-mng.js');

// managerMenu object, to be exported as a module
const managerMenu = {
	// initialization method for managerMenu -- 
	// checks if Bamazon server connection can be established before proceeding.
	initialize: function() {
		// attempts connection to mysql server. if it fails, program ends.
		// else, goes to managerMenu.main()
		bamazonDB.connect().then(function(connectMsg){
			// proceeds to managerMenu.main() if connection is successful
			console.log('\n' + connectMsg + 
				'\n\n*************** Welcome to Bamazon Management Interface ***************\n');
			return managerMenu.main();
		}).catch(function(errMsg){
			return console.log(errMsg);
		});
	}, // end of managerMenu.intitialize()

	// main menu function
	main: function() {

		console.log('\n======= MAIN MENU =======\n');

		prompt([
		{
			type: 'list',
			message: 'What can I help you with today?',
			choices: [
				'View Products for Sale',
				'View Low Inventory',
				'Add to Existing Inventory',
				'Add New Product',
				'Quit'
			],
			name: 'mainMenuChoice'
		}
		]).then(function(answers){
			switch (answers.mainMenuChoice) {
				case 'View Products for Sale':
					managerMenu.productMng.viewProductsForSale();
					break;
				case 'View Low Inventory':
					managerMenu.productMng.viewLowInventory();
					break;
				case 'Add to Existing Inventory':
					managerMenu.productMng.addToInventory();
					break;
				case 'Add New Product':
					managerMenu.productMng.addNewProduct();
					break;
				case 'Quit':
					managerMenu.quit();
					break;
			}
			return;
		});
	}, // end of managerMenu.main()
	// managerMenu.productMng subset object
	productMng: {
		viewProductsForSale: function() {
			console.log('\n ======= PRODUCTS FOR SALE =======\n');
			return managerMenu.main();
		},
		viewLowInventory: function() {
			console.log('\n ======= LOW INVENTORY PRODUCTS =======\n');
			return managerMenu.main();
		},
		addToInventory: function() {
			console.log('\n ======= ADD TO EXISTING INVENTORY =======\n');
			return managerMenu.main();
		},
		addNewProduct: function() {
			console.log('\n ======= ADD NEW PRODUCT =======\n');
			return managerMenu.main();
		}
	}, // end of managerMenu.productMng subset object
	// function for quitting the manager menu
	quit: function() {
		// handles promise returned from bamazonDB.quit()
		bamazonDB.quit().then(function(){
			return console.log('\nThank you for using the Bamazon management interface. Good bye...\n');
		}).catch(function(errMsg){
			return console.log(errMsg);
		});
	} // end of managerMenu.quit()
	
}; // end of managerMenu object

module.exports = managerMenu;