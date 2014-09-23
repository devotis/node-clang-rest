var config        = require('./config');
var Bunyan2Loggly = require('bunyan-loggly').Bunyan2Loggly;

module.exports.config = {
  name: config.loggly.tags && config.loggly.tags[0] || config.loggly.name,
  streams: [{
    type: 'raw',
    stream: new Bunyan2Loggly(config.loggly)
  }],
  excludes: ['req-headers', 'res-headers'], //as we already log res.headers and req.headers,
  serializers: {
    req: function (req) {
      return {
        method : req.method,  //default
        url    : req.url,     //default
        headers: req.headers, //default
        body   : req.body     //extra
      }
    }
  }  
};