var express = require('express');
var clang   = require('clang');
//var loggly  = require('loggly');
var config  = require('./config');

//var logger = loggly.createClient(config.loggly);
var api;
var app = express();
//the sequence of use() matters. It's the sequence middleware is executed
app.use(express.cookieParser());
app.use(express.session({secret: config.web.ssecret}));
app.use(require('express-loggly').requestLogger()); //http://stackoverflow.com/questions/7263626/node-js-how-to-do-something-on-all-http-requests-in-express
app.use(app.router);
// Since this is the last non-error-handling middleware use()d, we assume 404, as nothing else responded.
app.use(function(req, res, next){
    next([404, { status : "error",  error: 'Page not found....' }]);
    //pass it on to first piece of error-handling middleware
});

// error-handling middleware starts here. They take the same form as regular middleware,
// however they require an arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling middleware.
app.use(require('express-loggly').errorLogger()); //http://stackoverflow.com/questions/15684130/express-js-error-handling
app.use(function(err, req, res, next) {
    console.log('Error handler');
    if (err) {
        if (err.length === 2) {
            res.json(err[0], err[1])
        } else {
            res.json(500, { error: err.message });
        }
    } else {
        next();
    }
});

app.all('/clang/:object?/:id?/:customaction?', function(req, res, next) {
    throw new Error('try this errrrrqq123');
    
    var uuid = req.headers.uuid || req.query._uuid || req.session.uuid || '';
    //console.log('req.params', req.params);
    if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
        next([401, { status : "error", error: 'uuid missing or invalid (add _uuid=... to your url)' }]); //The client tried to operate on a protected resource without providing the proper authentication credentials.
        return; 
    }
    req.session.uuid = uuid; //store given uuid in session for the browser

    if (!api) {
        next([503, { status : "error", error: 'Clang api not created yet. Try again in a few seconds.' }]);
        return;
    }

    var clangObjectName = req.params.object;
    if (!clangObjectName) {
        next([500, { status : "error", error: 'Resource not specified' }]);
        return;
    }
    if (clangObjectName.match(/s$/) && !clangObjectName.match(/sms|tatistics$/)) {
        clangObjectName = clangObjectName.slice(0, -1);
    }
    if (Object.keys(api.objects).indexOf(clangObjectName) === -1) {
        next([404, { status : "error", error: 'Resource ('+clangObjectName+') actually not available' }]);
		return; 
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
                clangMethodName = 'getAll'
            } else {
                clangMethodName = 'getByObject'
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
                    next([500, { status : "error", error: 'Custom action invoked on unspecified resource (use /objects/123/customaction)' }]);
                    return;
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
            next([405, { status : "error", error: 'HTTP verb for this resource is not allowed'}]);
            return;
    }

    if ( !api.objects[clangObjectName][clangMethodName] ) {
        next([405, { status : "error", error: 'Method for this resource is not allowed'}]);
    }

    args.uuid = uuid;
    console.log('xxxxxxxxx')
    api.objects[clangObjectName][clangMethodName](args, function(err, rows) {
        if (err) {
            next([500, { status : "error", error: err.message }]);
        } else {
            res.json({status : "success", data : rows});
        }
    });
});


clang.init(function(err, result) {
    if (err) {
        console.log('Error creating clang api', err.message);    
    } else {
        console.log('Clang api created', ['clang', 'node']);
        api = result;

        app.listen(config.web.port);
        console.log('Listening on port '+config.web.port, ['clang', 'node', 'web']);
    }
});