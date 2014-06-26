//Get web.config variables into process.env
require('llips')().test.webconfig();
process.env['mocha-unfunk-style'] = 'css';

//describe('Brands',      require('./suites/customers')); check all uuids :)
describe('Customers',      require('./suites/customers'));