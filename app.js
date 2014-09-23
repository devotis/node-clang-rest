var config  = require('./config');
var lib     = require('./lib');
var log     = require('./log');
var llips   = require('llips')(config, lib);
var clang   = require('clang');
var express = require('express');
var RedisStore  = require('connect-redis')(express);

var api;
var app = express();
app.use(express.json());
app.use(express.cookieParser());
app.use(express.session({store: new RedisStore(config.web.session.redis), secret: config.web.session.secret}));
app.use(require('express-bunyan-logger')(log.config()));
app.use(app.router);
app.use(function(req, res, next){
  // Since this is the last non-error-handling middleware use()d, we assume 404, as nothing else responded.
  res.statusCode = 404;
  return next(new Error('40401')); //Page not found
});
// error-handling middleware starts here! They take the same form as regular middleware,
// however they require an arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling middleware.
app.use(require('express-bunyan-logger').errorLogger(log.config()));
app.use(llips.endWithError());

app.get('/clang', function(req, res, next) {
  res.redirect('https://github.com/devotis/node-clang-rest');
});

app.get('/clang/objects', function(req, res, next) {
  var result = {}, object;
  for (var key in api.objects) {
    if (api.objects.hasOwnProperty(key) && !key.match(/Set|resource/)) {
      object = api.objects[key];
      result[key] = {};
      for (var key2 in object) {
        if (object.hasOwnProperty(key2) && typeof object[key2] === "function") {
          result[key][key2] = 'function';
        }
      }
    }
  }

  res.json(200, {status : "success", data : result});
});

app.all('/clang/:object?/:id?/:customaction?', function(req, res, next) {
  var uuid = req.headers.uuid || req.query._uuid || req.session.uuid || '';
  if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
    res.statusCode = 401;
    return next(new Error('40102')); //uuid missing etc
  }
  req.session.uuid = uuid; //store given uuid in session for the browser

  if (!api) {
    res.statusCode = 503;
    return next(new Error('50001')); //Clang api not created yet. Try again in a few seconds.
  }

  var clangObjectName = req.params.object;
  if (!clangObjectName) {
    res.statusCode = 500;
    return next(new Error('50002')); //Clang resource not specified
  }
  if (clangObjectName.match(/s$/) && !clangObjectName.match(/sms|tatistics$/)) {
    clangObjectName = clangObjectName.slice(0, -1);
  }
  if (Object.keys(api.objects).indexOf(clangObjectName) === -1) {
    res.statusCode = 404;
    return next({message: '50003', resource: clangObjectName}); //Resource {resource} actually not available
  }

  var clangMethodName;
  var args = {};
  var method = req.query._method || req.method;  //HTTP VERB override through query paramater (override through http header would be better)

  delete req.query._method;
  delete req.query._uuid;
  var numKeys = Object.keys(req.query).length;

  switch(method) {
  case 'GET'   : 
    if (req.params.id) {
      clangMethodName = 'getById';
      args      = req.query;
      args[clangObjectName + 'Id'] = req.params.id;
    } else if (numKeys === 0) {
      clangMethodName = 'getAll';
    } else if (req.query['externalId'] && numKeys === 1) {
      clangMethodName = 'getByExternalId';
      args['externalId'] = req.query['externalId'];
    } else {
      clangMethodName = 'getByObject';
      args      = req.query;
    } 
    break;
  case 'POST'  :
    if (req.params.customaction) {
      clangMethodName = req.params.customaction; //override methodName with custom action like sendToCustomer (for POST only)
      if (req.params.id) {
        args             = req.query;
        args[clangObjectName + 'Id'] = req.params.id;
      } else {
        res.statusCode = 500;
        return next(new Error('50004')); //Custom action invoked on unspecified resource (use /objects/123/customaction)
      }
    } else {
      clangMethodName = 'insert';
      args      = req.query;
    }
    break;
  case 'PUT'   :
    clangMethodName   = 'update';
    args        = req.query;
    args.id       = req.params.id;
    break;
  case 'DELETE':
    clangMethodName   = 'delete';
    args.id       = req.params.id;
    break;
  default    :
    res.statusCode = 405;
    return next(new Error('50005')); //HTTP verb for this resource is not allowed
  }

  if ( !api.objects[clangObjectName][clangMethodName] ) {
    res.statusCode = 405;
    return next(new Error('50006')); //Method for this resource is not allowed
  }

  args.uuid = uuid;
  console.log('clang call via rest interface', clangObjectName, clangMethodName, req.protocol + '://' + req.get('host') + req.originalUrl);

  api.objects[clangObjectName][clangMethodName](args, llips.resToRes(req, res, next, 200));
});

clang.init(function(err, result) {
  if (err) {
    console.error('Error creating clang api' + err.message);  
  } else {
    console.info('Clang api created');
    api = result;

    app.listen(config.web.port);
    console.info('Listening on port ' + config.web.port);
  }
});
