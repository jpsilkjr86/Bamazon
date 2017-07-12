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
			bamazonDB.products.addStock(1, 1).then(function(result){
				console.log('\n ======= ADD TO EXISTING INVENTORY =======\n');
				console.log(result);
				return managerMenu.main();
			}).catch(function(errMsg){
				console.log(errMsg);
				return managerMenu.main();
			});
		}, // end of productMng.addToInventory()
		addNewProduct: function() {
			console.log('\n ======= ADD NEW PRODUCT =======\n');
			return managerMenu.main();
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