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
			console.log(answers);
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
			// gets table of data from bamazonDB.query promise
			bamazonDB.query('SELECT * FROM ??', ['products']).then(function(products){
				console.log('\n ======= PRODUCTS FOR SALE =======\n');				
				// instantiates table from cli-table node module
				let table = new Table({
					head: ['Item ID', 'Product Name', 'Department', 'Price', 'Stock Qty'],
					chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
			         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
			         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
			         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
				});
				// loops through products and pushes onto cli-table
				for (let i = 0; i < products.length; i++) {
					table.push([
						products[i].item_id,
						products[i].product_name,
						products[i].department_name,
						products[i].price,
						products[i].stock_quantity
					]);
				}
				// displays talbe and returns to main menu
				console.log(table.toString());
				return managerMenu.main();
			}).catch(function(errMsg){
				console.log(errMsg);
			}); // end of bamazonDB.query() promise
		}, // end of productMng.viewProductsForSale()
		viewLowInventory: function() {
			// gets table of data from bamazonDB.query promise
			bamazonDB.query(
				'SELECT * FROM ?? WHERE ?? < ?',
				['products', 'stock_quantity', 5]
			).then(function(products){
				console.log('\n ======= LOW INVENTORY PRODUCTS =======\n');
				// instantiates table from cli-table node module
				let table = new Table({
					head: ['Item ID', 'Product Name', 'Department', 'Price', 'Stock Qty'],
					chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
			         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
			         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
			         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
				});
				// loops through products and pushes onto cli-table
				for (let i = 0; i < products.length; i++) {
					table.push([
						products[i].item_id,
						products[i].product_name,
						products[i].department_name,
						products[i].price,
						products[i].stock_quantity
					]);
				}
				// displays talbe and returns to main menu
				console.log(table.toString());
				return managerMenu.main();
			}).catch(function(errMsg){
				console.log(errMsg);
			}); // end of bamazonDB.query() promise
		}, // end of productMng.viewLowInventory()
		addToInventory: function() {
			console.log('\n ======= ADD TO EXISTING INVENTORY =======\n');
			console.log("\nWhich item's stock would you like to add inventory to today?\n");
			// Prompt 1: ask user to enter the item_id of the product they would
			// like to add inventory to
			prompt([
			{
				type: 'input',
				message: 'Item ID:',
				name: 'requested_id',
				validate: function(str) {
					if (isNaN(str)) {
						console.log('\n\nPlease enter a valid number.\n');
						return false;
					}
					if (parseInt(str) < 1) {
						console.log('\n\nInput must be greater than zero.\n');
						return false;
					}
					return true;
				},
				filter: function(str) {
					return parseInt(str.trim());
				}
			},{ 
			// Prompt 2: ask the quantity of stock to add
				type: 'input',
				message: 'Quantity to Increase:',
				name: 'quantity_to_increase',
				validate: function(str) {
					if (isNaN(str)) {
						console.log('\n\nPlease enter a valid number.\n');
						return false;
					}
					if (parseInt(str) < 0) {
						console.log('\n\nInput may not be less than zero.\n');
						return false;
					}
					return true;
				},
				filter: function(str) {
					return parseInt(str.trim());
				}
			}
			// promise resolve handler for prompt()
			]).then(function(answers){
				// if quantity_to_increase is zero, return to main menu
				if (answers.quantity_to_increase === 0) {
					return managerMenu.main();
				}

				// first finds the product by id to make sure it exists before proceeding
				bamazonDB.products.getById(answers.requested_id).then(function(product){
					// adds stock after product is retrieved from the database
					bamazonDB.products.addStock(
						answers.requested_id, answers.quantity_to_increase
					).then(function(result){
						console.log(result);
						return managerMenu.main();
					}).catch(function(errMsg){
						console.log("\nWe're sorry, but we were unable to process your request.\n"
							+ 'Reason: ' + errMsg);
						return managerMenu.main();
					}); // end of addStock() promise
				}).catch(function(errMsg){
					console.log("\nWe're sorry, but we were unable to process your request.\n"
						+ 'Reason: ' + errMsg);
					return managerMenu.main();
				}); // end of getById() promise
			}); // end of prompt() promise
		}, // end of productMng.addToInventory()
		addNewProduct: function() {
			console.log('\n ======= ADD NEW PRODUCT =======\n');
			console.log("\nPlease enter information about the product you'd like to add.\n");
			// Prompt 1: ask user to enter the product name
			prompt([
			{
				type: 'input',
				message: 'Product Name (Required):',
				name: 'product_name',
				filter: function(str) {
					return str.trim();
				},
				validate: function(str) {
					if (str == null || str == '') {
						console.log('\n\nRequired Input - empty string not permitted.\n');
						return false;
					}
					return true;
				}
			},{ 
			// Prompt 2: ask name of department the product should be placed in
				type: 'input',
				message: 'Department:',
				name: 'department_name',
				filter: function(str) {
					return str.trim();
				}
			},{
			// Prompt 3: ask price of product
				type: 'input',
				message: 'Price: $',
				name: 'price',
				filter: function(str) {
					return str.trim();
				},
				validate: function(value) {
					if (isNaN(value)) {
						console.log('\n\nPrice must be a valid number.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					if (parseInt(value) === 0) {
						console.log('\n\nPrice may not be equal to zero.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					if (parseInt(value) < 0) {
						console.log('\n\nPrice may not be less than zero.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					return true;
				}
			},{
			// Prompt 4: ask starting stock quantity
				type: 'input',
				message: 'Starting Stock Quantity:',
				name: 'stock_quantity',
				filter: function(str) {
					return str.trim();
				},
				validate: function(value) {
					if (isNaN(value)) {
						console.log('\n\nQuantity must be a valid number.\n'
							+ 'If it is yet to be determined, just enter zero or leave it blank.\n');
						return false;
					}
					if (parseInt(value) < 0) {
						console.log('\n\nQuantity may not be less than zero.\n'
							+ 'If it is yet to be determined, just enter zero or leave it blank.\n');
						return false;
					}
					return true;
				}
			}
			// promise resolve handler for prompt()
			]).then(function(answers){
				// prompt to confirm details
				console.log(answers);
				return managerMenu.main();
					// if no, return to main main

					// add product to Bamazon database
			}); // end of prompt() promise
		} // end of productMng.addNewProduct()
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