var config  = require('./config');
var clang   = require('clang');
var express = require('express');
var logger  = require('express-loggly')(config.loggly);

var api;
var app = express();
app.use(express.cookieParser());
app.use(express.session({secret: config.web.ssecret}));
app.use(logger.requestLogger());
app.use(app.router);
app.use(function(req, res, next){
    // Since this is the last non-error-handling middleware use()d, we assume 404, as nothing else responded.
    res.statusCode = 404;
    return next(new Error('Page not found'));
});
// error-handling middleware starts here! They take the same form as regular middleware,
// however they require an arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling middleware.
app.use(logger.errorLogger()); //http://stackoverflow.com/questions/15684130/express-js-error-handling
app.use(function(err, req, res, next) {
    res.json(500, { status : "error", error: (typeof err === 'string' ? err : err.message) });
});

app.get('/', function(req, res, next) {
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
        return next(new Error('uuid missing or invalid (add _uuid=... to your url)')); //The client tried to operate on a protected resource without providing the proper authentication credentials.
    }
    req.session.uuid = uuid; //store given uuid in session for the browser

    if (!api) {
        res.statusCode = 503;
        return next(new Error('Clang api not created yet. Try again in a few seconds.'));
    }

    var clangObjectName = req.params.object;
    if (!clangObjectName) {
        res.statusCode = 500;
        return next(new Error('Resource not specified'));
    }
    if (clangObjectName.match(/s$/) && !clangObjectName.match(/sms|tatistics$/)) {
        clangObjectName = clangObjectName.slice(0, -1);
    }
    if (Object.keys(api.objects).indexOf(clangObjectName) === -1) {
        res.statusCode = 404;
        return next(new Error('Resource ('+clangObjectName+') actually not available'));
    }

    var clangMethodName;
    var args = {};
    var method = req.query._method || req.method;  //HTTP VERB override through query paramater (override through http header would be better)

    delete req.query._method;
    delete req.query._uuid;

    switch(method) {
    case 'GET'   : 
        if (req.params.id) {
            clangMethodName = 'getById';
            args            = req.query;
            args[clangObjectName + 'Id'] = req.params.id;
        } else if (Object.keys(req.query).length === 0) {
            clangMethodName = 'getAll';
        } else {
            clangMethodName = 'getByObject';
            args            = req.query;
        } 
        break;
    case 'POST'  :
        if (req.params.customaction) {
            clangMethodName = req.params.customaction; //override methodName with custom action like sendToCustomer (for POST only)
            if (req.params.id) {
                args                         = req.query;
                args[clangObjectName + 'Id'] = req.params.id;
            } else {
                res.statusCode = 500;
                return next(new Error('Custom action invoked on unspecified resource (use /objects/123/customaction)'));
            }
        } else {
            clangMethodName = 'insert';
            args            = req.query;
        }
        break;
    case 'PUT'   :
        clangMethodName     = 'update';
        args                = req.query;
        args.id             = req.params.id;
        break;
    case 'DELETE':
        clangMethodName     = 'delete';
        args.id             = req.params.id;
        break;
    default      :
        res.statusCode = 405;
        return next(new Error('HTTP verb for this resource is not allowed'));
    }

    if ( !api.objects[clangObjectName][clangMethodName] ) {
        res.statusCode = 405;
        return next(new Error('Method for this resource is not allowed'));
    }

    args.uuid = uuid;

    api.objects[clangObjectName][clangMethodName](args, function(err, rows) {
        if (err) {
            res.statusCode = 500;
            return next(err);
        }

        res.json(200, {status : "success", data : rows});
    });
});

clang.init(logger, function(err, result) {
    if (err) {
        logger.error('Error creating clang api' + err.message);    
    } else {
        logger.info('Clang api created');
        api = result;

        app.listen(config.web.port);
        logger.info('Listening on port ' + config.web.port);
    }
});