const express = require('express');
const helmet = require('helmet');
const enforce = require('express-sslify');
const createError = require('http-errors');
const winston = require('winston');
const expressWinston = require('express-winston');
const clangRequest = require('./lib/clangRequest');
const prepare = require('./lib/prepare');

const port = process.env.PORT || 5000;

const app = express();
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
}
app.use(express.json());

expressWinston.requestWhitelist.push('body', 'ip');
expressWinston.responseWhitelist.push('body');
app.use(
    expressWinston.logger({
        transports: [
            new winston.transports.Console({
                json: true,
                stringify: true,
                timestamp: true,
            }),
        ],
        expressFormat: true,
    })
);

app.get('/:object/:id?', prepare, (req, res, next) => {
    const { clangObjectName } = req.prepared;
    let clangMethodName;
    let args;

    const numKeys = Object.keys(req.query).length;
    if (req.params.id) {
        clangMethodName = 'getById';
        args = {
            ...req.query,
            [clangObjectName + 'Id']: req.params.id,
        };
    } else if (numKeys === 0) {
        clangMethodName = 'getAll';
        args = {};
    } else if (req.query['externalId'] && numKeys === 1) {
        clangMethodName = 'getByExternalId';
        args = {
            externalId: req.query['externalId'],
        };
    } else {
        clangMethodName = 'getByObject';
        args = {
            [clangObjectName]: { ...req.query },
        };
    }

    clangRequest(req, res, next, clangObjectName, clangMethodName, args);
});

app.post('/:object', prepare, (req, res, next) => {
    const { clangObjectName } = req.prepared;
    const clangMethodName = 'insert';
    const args = {
        [clangObjectName]: { ...req.query, ...req.body },
    };
    clangRequest(req, res, next, clangObjectName, clangMethodName, args);
});

app.post('/:object/:id/:customaction', prepare, (req, res, next) => {
    const { clangObjectName } = req.prepared;
    const { customaction: clangMethodName } = req.params;
    const args = {
        ...req.query,
        ...req.body,
        [clangObjectName + 'Id']: req.params.id,
    };
    clangRequest(req, res, next, clangObjectName, clangMethodName, args);
});

app.put('/:object/:id', prepare, (req, res, next) => {
    const { clangObjectName } = req.prepared;
    const clangMethodName = 'update';
    const args = {
        [clangObjectName]: {
            ...req.query,
            ...req.body,
            id: req.params.id,
        },
    };
    clangRequest(req, res, next, clangObjectName, clangMethodName, args);
});

app.delete('/:object/:id', prepare, (req, res, next) => {
    const { clangObjectName } = req.prepared;
    const clangMethodName = 'delete';
    const args = {
        [clangObjectName]: {
            id: req.params.id,
        },
    };
    clangRequest(req, res, next, clangObjectName, clangMethodName, args);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({ error: err });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
