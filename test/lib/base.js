var _       = require('lodash');

if (__dirname.match(/websites\\node\.leadstoloyals\.com\\/)) {
  exports.nodeUrl  = 'https://node.leadstoloyals.com';
  exports.clangUrl = 'https://node.leadstoloyals.com/clang';
} else {
  exports.nodeUrl  = 'https://node-dev.leadstoloyals.com';
  exports.clangUrl = 'https://node-dev.leadstoloyals.com/clang';
}

exports.brands = {
  sca   : "dba7fff6-befb-4cb1-b344-97a728942ed2",
  sbb   : "5ec56aad-fb31-4b58-a41f-d59764466339",
  ms4l  : "9b2fcef1-8aeb-4e40-834b-21ea5413380f",
  masa  : "2e4c06eb-e377-48a5-a25f-4fe2eb285b8b",
  loyalz: "1-99d5d0f4-76b5-11e3-98f8-efefd2753661",
  gall  : "18c9db87-58f6-4022-afd2-37772fb57206",
  vdv   : "9bcf5393-8fbe-4c1f-ae74-322abfe6a505",
  scanapp:"1-1a804f0c-7f2e-11e2-afe0-00221985dc7d"
};

exports.anErrorCode = function(code) {
  return function(res) {
    if (res.body.profile) {
      res.body.should.have.property('error');
      if (res.body.error.length) {
        var myError =  _.filter(res.body.error, {code: code});
        myError.should.be.an.Array.with.lengthOf(1);
        myError[0].should.have.property('code', code);
      } else {
        res.body.error.should.have.property('code', code);
      }
    } else if (code.length === 3) { //"213: Customer not found"
      res.body.should.have.property('code', 'NONE');
      res.body.should.have.property('message').and.match(new RegExp('^' + code + ':.+'));
    } else {
      res.body.should.have.property('code', code);
    }
  };
};

