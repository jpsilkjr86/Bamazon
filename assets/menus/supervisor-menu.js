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
		console.log('\n ======= MAIN MENU =======\n');

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
					supervisorMenu.departmentMng.viewProductSales();
					break;
				case 'Create New Department':
					supervisorMenu.departmentMng.createNewDept();
					break;
				case 'Quit':
					supervisorMenu.quit();
					break;
			}
			return;
		});
	}, // end of supervisorMenu.main()
	// supervisorMenu.departmentMng subset object
	departmentMng: {
		viewProductSales: function () {
			console.log('\n ======= PRODUCT SALES BY DEPARTMENT =======\n');

			bamazonDB.departments.viewProductSales().then(function(results){
				// instantiates table from cli-table node module
				let table = new Table({
					head: ['Department', 'Overhead Costs', 'Total Product Sales', 'Total Profit'],
					chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
			         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
			         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
			         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
				});
				// loops through results and pushes data onto cli-table
				for (let i = 0; i < results.length; i++) {
					// instantiates locally scoped variables equal to column values
					let name = results[i].department_name;
					let costs = results[i].over_head_costs;
					let sales = results[i].total_product_sales;
					let profit = results[i].total_profit;
					// checks if total_product_sales is null. If so, sets equal to 
					// '(No products added)'; else, puts dollar sign in front.
					// null values come from when a department is created but no new 
					// products have been added to it yet.
					if (sales == null) {
						sales = '(No products added)';
					}
					else {
						sales = '$' + sales;
					}
					// pushes values onto table of cli-table module
					table.push([name, '$' + costs, sales, profit]);
				}
				// displays talbe and returns to main menu
				console.log(table.toString());
				return supervisorMenu.main();
			// error handler for viewProductSales() promise
			}).catch(function(errMsg){
				console.log(errMsg);
				return supervisorMenu.main();
			}); // end of viewProductSales() promise
		}, // end of departmentMng.viewProductSales()
		createNewDept: function () {
			console.log('\n ======= CREATE NEW DEPARTMENT =======\n');
			console.log("\nPlease enter information about the department you'd like to create.\n");

			prompt([
			{ // Q1: ask user to enter the department name
				type: 'input',
				message: 'Department Name (Required):',
				name: 'department_name',
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
			},{ // Q2: ask overhead costs
				type: 'input',
				message: 'Overhead Costs: $',
				name: 'over_head_costs',
				filter: function(str) {
					if (str === '') {
						return null;
					}
					return parseInt(str.trim());
				},
				validate: function(value) {
					if (value === null) {
						return true;
					}
					if (isNaN(value)) {
						console.log('\n\nOverhead cost must be a valid number.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					if (value === 0) {
						console.log('\n\nOverhead cost may not be equal to zero.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					if (value < 0) {
						console.log('\n\nOverhead cost may not be less than zero.\n'
							+ 'If it is yet to be determined, just leave the field blank.\n');
						return false;
					}
					return true;
				}
			} // promise handler for prompt()
			]).then(function(answersOne){
				console.log('\nReview new department information:\n'
					+ '\nDepartment Name: ' + answersOne.department_name
					+ '\nOverhead Costs: $' + answersOne.over_head_costs + '\n');
				
				// prompt to confirm details. this prompt is named promptTwo and sent as an argument
				// to Promise.all() above along with answersOne from first prompt. This allows
				// promise .then() functions to be chained and handle all errors in one final 
				// .catch() at the end.
				let promptTwo = prompt([{
					type: 'confirm',
					message: 'Is the above information correct?',
					name: 'confirm',
					default: false
				// promise for confirm prompt
				}]);
				return Promise.all([answersOne, promptTwo]);
			// promsise for Promise.all() above, returns array with answersOne and answers from 
			// promptTwo
			}).then(function(answersAry){
				// if no, throws an error so that it jumps directly to the catch
				// handler of the promise chain
				if (answersAry[1].confirm === false) {
					throw 'Add new department request canceled';
				}
				// sends answers from the first prompt to bamazonDB.departments.addNew()
				// and returns the function call, itself a promise, to continue the promise chain.
				return bamazonDB.departments.addNew(
					answersAry[0].department_name,
					answersAry[0].over_head_costs
				);
			}).then(function(results){
				console.log('\n\nDepartment successfully created!\n'
					+ 'Returning to the main menu...\n');
				return supervisorMenu.main();
			// error handler for addNew() promise
			}).catch(function(errMsg){
				if (errMsg === 'Add new department request canceled') {
					console.log('\nReturning to the main menu...\n');
					return supervisorMenu.main();
				}
				console.log("\nWe're sorry, but we were unable to process your request.\n"
					+ 'Reason: ' + errMsg + '\n');
				return supervisorMenu.main();							
			});	// end of promise chain
		} // end of departmentMng.createNewDept()
	}, // end of departmentMng subset object
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