var should = require('should');
var _      = require('lodash');
var async  = require('async');

var config = require('../../config');
var lib    = require('../../lib');
var llips  = require('llips')(config, lib);
var base   = require('../lib/base');

var supertest = require('supertest');
var requestClang   = supertest(base.clangUrl);

var keys = Object.keys(base.brands);

module.exports = function() {
  keys.forEach(function(key) {
    it('Brand ' + key + ' should work', function(done) {
      this.timeout(10*1000); //10 seconde, ivm trage responstijd Clang
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