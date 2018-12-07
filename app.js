var express = require('express');
var helmet = require('helmet');
const enforce = require('express-sslify');
var winston    = require('winston');
var expressWinston = require('express-winston');
var Clang   = require('clang');

var clang = new Clang();

const port = process.env.PORT || 5000;

var app   = express();
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

expressWinston.requestWhitelist.push('body', 'ip');
expressWinston.responseWhitelist.push('body');
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: true,
      stringify: true,
      timestamp: true
    })
  ],
  expressFormat: true
}));

app.all('/clang/:object/:id?/:customaction?', function(req, res) {
  var uuid = req.headers.uuid || req.query._uuid;
  if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
    return res.status(401).send({message: 'uuid missing or invalid (add _uuid=... to your url)'});
  }

  var clangObjectName = req.params.object;
  //remove a trailing s
  if (clangObjectName.match(/s$/) && !clangObjectName.match(/sms|tatistics$/)) {
    clangObjectName = clangObjectName.slice(0, -1);
  }

  var clangMethodName;
  var args = {};
  var method = req.query._method || req.method;  //HTTP VERB override through query paramater (override through http header would be better)

  delete req.query._method;
  delete req.query._uuid;
  var numKeys = Object.keys(req.query).length;

  switch(method) {
    case 'GET':
      if (req.params.id) {
        clangMethodName = 'getById';
        args = req.query;
        args[clangObjectName + 'Id'] = req.params.id;
      } else if (numKeys === 0) {
        clangMethodName = 'getAll';
      } else if (req.query['externalId'] && numKeys === 1) {
        clangMethodName = 'getByExternalId';
        args['externalId'] = req.query['externalId'];
      } else {
        clangMethodName = 'getByObject';
        args[clangObjectName] = req.query;
      }
    break;
    case 'POST':
      if (req.params.customaction) {
        clangMethodName = req.params.customaction; //override methodName with custom action like sendToCustomer (for POST only)
        if (req.params.id) {
          args = req.query;
          args[clangObjectName + 'Id'] = req.params.id;
        } else {
          return res.status(500).send({message: 'Custom action invoked on unspecified resource (use /objects/123/customaction)'});
        }
      } else {
        clangMethodName = 'insert';
        args[clangObjectName] = req.query;
      }
    break;
    case 'PUT':
      clangMethodName = 'update';
      args[clangObjectName] = req.query;
      args[clangObjectName].id = req.params.id;
    break;
    case 'DELETE':
      clangMethodName = 'delete';
      args[clangObjectName].id = req.params.id;
      break;
    default:
      return res.status(405).send({message: 'HTTP verb for this resource is not allowed'});
  }

  args.uuid = uuid;

  clang.request(clangObjectName + '_' + clangMethodName, args, function(err, result) {
    if (err) {
      var status = 500;
      if (err.Fault && (err.Fault.faultcode == 213 || err.Fault.faultstring.match(/not found/i))) {
        status = 404;
      }
      if (err.Fault) {
        return res.status(status).send(err.Fault);
      }
      return res.status(status).send({
        message: err.message,
        method: method,
        params: req.params
      });
    }
    res.status(200).json(result);
  });
});

var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('app listening at http://%s:%s', host, port);

});
