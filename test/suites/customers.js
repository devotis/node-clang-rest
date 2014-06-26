var should = require('should');
var _      = require('lodash');
var async  = require('async');

var config = require('../../config');
var lib    = require('../../lib');
var llips  = require('llips')(config, lib);
var base   = require('../lib/base');

var supertest = require('supertest');
var requestClang   = supertest(base.clangUrl);

var email;

module.exports = function() {
  it('Getting some customers should work', function(done) {
    this.timeout(10*1000); //30 seconden, ivm trage responstijd Clang
    requestClang
      .get('/customers')
      .set('uuid', base.brands.loyalz)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        res.body.data.should.be.an.Array.and.have.property('length').above(0);
        res.body.data.should.be.an.Array.and.have.property('length').below(51);
        console.log('length', res.body.data.length);
        res.body.data.forEach(function(record) {
          record.should.have.property('id').and.be.above(0);
        });        
      })
      .expect(200)
      .end(llips.test.noIISnodeDevError(done));
  }); //it

  it('Getting some emails should work', function(done) {
    this.timeout(10*1000); //30 seconden, ivm trage responstijd Clang
    requestClang
      .get('/emails')
      .set('uuid', base.brands.loyalz)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        res.body.data.should.be.an.Array.and.have.property('length').above(0);
        console.log('length', res.body.data.length);
        res.body.data.forEach(function(record) {
          record.should.have.property('id').and.be.above(0);
        });
        email = res.body.data[0];
      })
      .expect(200)
      .end(llips.test.noIISnodeDevError(done));
  }); //it

  it('Send email via llips should work', function(done) {
    this.timeout(10*1000); //30 seconden, ivm trage responstijd Clang
    llips.clang.send(email.id, {
      externalId  : 'NodeJS - Mocha',
      emailAddress: 'christiaan.westerbeek+clang-ltoltest@leadstoloyals.com'
    }, function(err, res) {
      res.should.have.property('status', 'success');
      res.data.should.be.an.Array.with.lengthOf(1);
      res.data[0].should.have.property('msg', true);
      done();
    });
  }); //it
};