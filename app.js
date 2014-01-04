var express = require('express');
var clang   = require('clang');
var config  = require('./config');

var api;
var app = express();
app.use(express.cookieParser());
app.use(express.session({secret: config.web.ssecret}));

app.all('/api/clang/:object?/:id?', function(req, res) {
    var uuid = req.headers.uuid || req.query._uuid || req.session.uuid || '';
    if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
        res.json(401, { error: 'uuid missing or invalid' }); //The client tried to operate on a protected resource without providing the proper authentication credentials.
        return; 
    }
    req.session.uuid = uuid; //store given uuid in session for the browser

    if (!api) {
        clang.init('1.18', function(err, result) {
            if (err) {
                console.log('Error creating clang api', err.message);    
            } else {
                console.log('Clang api created');
                api = result;
            }
        });

        res.json(503, { error: 'Clang api not created yet. Try again in a few seconds.' })
        return;
    }

    if (Object.keys(api.objects).indexOf(req.params.object) === -1) {
        res.json(404, { error: 'Resource ('+req.params.object+') actually not available' });
		return; 
    }

    console.log('req.params', req.params);
    var clangObjectName = req.params.object;
    var clangMethodName;
    var args = {};
    var method = req.query._method || req.method;  //HTTP VERB override through query paramater (override through http header would be better)

    delete req.query._method;
    delete req.query._uuid;

    switch(method) {
    	case 'GET'   : 
            if (req.params.id) {
                clangMethodName = 'getById'
                args[clangObjectName + 'Id'] = req.params.id;
            } else if (Object.keys(req.query).length === 0) {
                clangMethodName = 'getAll'
            } else {
                clangMethodName = 'getByObject'
                args[clangObjectName] = req.query;
            } 
            break;
    	case 'POST'  :
            clangMethodName          = 'insert';
            args[clangObjectName]    = req.query;
            break;
    	case 'PUT'   :
            clangMethodName          = 'update';
            args[clangObjectName]    = req.query;
            args[clangObjectName].id = req.params.id;
            break;
    	case 'DELETE':
            clangMethodName          = 'delete';
            args[clangObjectName].id = req.params.id;
            break;
    	default      :
            res.json(405, { error: 'HTTP verb for this resource is not allowed'});
            return;
    }

    args.uuid = uuid;

    api.objects[clangObjectName][clangMethodName](args, function(err, rows) {
        if (err) {
            res.json(500, { error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.listen(3000);
console.log('Listening on port 3000');
