var _       = require('lodash');

if (__dirname.match(/websites\\node\.leadstoloyals\.com\\/)) {
  exports.nodeUrl  = 'https://node.leadstoloyals.com';
  exports.clangUrl = 'https://node.leadstoloyals.com/clang';
} else {
  exports.nodeUrl  = 'https://node-dev.leadstoloyals.com';
  exports.clangUrl = 'https://node-dev.leadstoloyals.com/clang';
}

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
    } else {
      res.body.should.have.property('code', code);
    }
  };
};

