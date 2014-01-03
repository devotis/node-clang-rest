var express = require('express');
var clang   = require('clang');

var api;
var app = express();
app.all('/api/clang/:object?/:id?', function(req, res) {
    if (!api) {
        var uuid = req.headers.uuid || req.query._uuid;
        if (!uuid || !uuid.match(/^([0-9]-)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)) { //Clang (probably) uses a version 4 UUIDs scheme relying only on random numbers.
            res.status(401); //The client tried to operate on a protected resource without providing the proper authentication credentials.
            res.send('401 - uuid missing or invalid');
            return; 
        }

        clang.init(uuid, '1.18', function(err, result) {
            if (err) {
                console.log('Error creating clang api', err.message);    
            } else {
                console.log('Clang api created');
                api = result;
            }
        });

        res.send('Clang api not created yet. Wait a few seconds and try again.')
        return;
    }

    if (Object.keys(api.objects).indexOf(req.params.object) === -1) {
    	res.status(404);
		res.send('404 - resource actually not available');
		return; 
    }

    console.log('req.params', req.params);
    var clangObjectName = req.params.object;
    var clangMethodName;
    var args = {};

    switch(req.query._method || req.method) { //HTTP VERB override through query paramater (override through http header would be better)
    	case 'GET'   : 
            if (req.params.id) {
                clangMethodName = 'getById'
                args[clangObjectName + 'Id'] = req.params.id;
            } else if (Object.keys(req.query).length===0) {
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
            res.status(405); return; //HTTP verb used to access this page is not allowed
    }
    
    api.objects[clangObjectName][clangMethodName](args, function(err, rows) {
        if (err) {
            res.status(500);
            res.send('500 - ' + err.message)
        } else {
            res.send(rows);
        }
    });
});

app.listen(3000);
console.log('Listening on port 3000');
