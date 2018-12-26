const config = require('../../config');
const lib = require('../../lib');
const llips = require('llips')(config, lib);
const base = require('../lib/base');

const supertest = require('supertest');
const requestClang = supertest(base.clangUrl);

const keys = Object.keys(base.brands);

module.exports = function() {
    keys.forEach(function(key) {
        it('Brand ' + key + ' should work', function(done) {
            this.timeout(10 * 1000); //10 seconde, ivm trage responstijd Clang
            requestClang
                .get('/customers/0')
                .set('uuid', base.brands[key])
                .expect('Content-Type', /json/)
                .expect(500)
                .expect(base.anErrorCode('213'))
                .end(llips.test.noIISnodeDevError(done));
        });
    });
};
