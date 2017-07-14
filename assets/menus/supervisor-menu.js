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
				// loops through results and pushes onto cli-table
				for (let i = 0; i < results.length; i++) {
					table.push([
						results[i].department_name,
						'$' + results[i].over_head_costs,
						'$' + results[i].total_product_sales,
						results[i].total_profit
					]);
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
				// prompt to confirm details
				prompt([{
					type: 'confirm',
					message: 'Is the above information correct?',
					name: 'confirm',
					default: false
				}]).then(function(answersTwo){
					// if no, return to main main
					if (answersTwo.confirm === false) {
						console.log('\n\nReturning to the main menu...\n');
						return supervisorMenu.main();
					}
					// sends answersOne to bamazonDB.departments.addNew()
					bamazonDB.departments.addNew(
						answersOne.department_name,
						answersOne.over_head_costs
					).then(function(results){
						console.log('\n\Department successfully created!\n'
							+ 'Returning to the main menu...\n');
						return supervisorMenu.main();
					// error handler for addNew() promise
					}).catch(function(errMsg){
						console.log("\nWe're sorry, but we were unable to process your request.\n"
							+ 'Reason: ' + errMsg + '\n');
						return supervisorMenu.main();							
					});	// end of bamazonDB.departments.addNew() promise 
				}); // end of second prompt() promise
			}); // end of first prompt() promise
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