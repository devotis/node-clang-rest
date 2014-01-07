var express = require('express');
var clang   = require('clang');
var config  = require('./config');

var api;
var app = express();
app.use(express.cookieParser());
app.use(express.session({secret: config.web.ssecret}));

app.all('/clang/:object?/:id?/:customaction?', function(req, res) {
    var uuid = req.headers.uuid || req.query._uuid || req.session.uuid || '';
    //console.log('req.params', req.params);
    if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
        res.json(401, { status : "error", error: 'uuid missing or invalid (add _uuid=... to your url)' }); //The client tried to operate on a protected resource without providing the proper authentication credentials.
        return; 
    }
    req.session.uuid = uuid; //store given uuid in session for the browser

    if (!api) {
        res.json(503, { status : "error", error: 'Clang api not created yet. Try again in a few seconds.' });
        return;
    }

    var clangObjectName = req.params.object;
    if (!clangObjectName) {
        res.json(500, { status : "error", error: 'Resource not specified' });
        return;
    }
    if (clangObjectName.match(/s$/) && !clangObjectName.match(/sms|tatistics$/)) {
        clangObjectName = clangObjectName.slice(0, -1);
    }
    if (Object.keys(api.objects).indexOf(clangObjectName) === -1) {
        res.json(404, { status : "error", error: 'Resource ('+clangObjectName+') actually not available' });
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
                    res.json(500, { status : "error", error: 'Custom action invoked on unspecified resource (use /objects/123/customaction)' });
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
            res.json(405, { status : "error", error: 'HTTP verb for this resource is not allowed'});
            return;
    }

    if ( !api.objects[clangObjectName][clangMethodName] ) {
        res.json(405, { status : "error", error: 'Method for this resource is not allowed'});
    }

    args.uuid = uuid;

    api.objects[clangObjectName][clangMethodName](args, function(err, rows) {
        if (err) {
            res.json(500, { status : "error", error: err.message });
        } else {
            res.json({status : "success", data : rows});
        }
    });
});

clang.init(function(err, result) {
    if (err) {
        console.log('Error creating clang api', err.message);    
    } else {
        console.log('Clang api created');
        api = result;

        app.listen(config.web.port);
        console.log('Listening on port '+config.web.port);
    }
});