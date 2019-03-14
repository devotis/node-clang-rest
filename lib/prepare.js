const createError = require('http-errors');

module.exports = (req, res, next) => {
    const uuid = req.headers.uuid || req.query._uuid;
    if (!uuid) {
        return next(createError(401, 'No uuid header found'));
    }

    let clangObjectName = req.params.object;
    //remove a trailing s
    if (
        clangObjectName.match(/s$/) &&
        !clangObjectName.match(/sms|tatistics$/)
    ) {
        clangObjectName = clangObjectName.slice(0, -1);
    }

    const method = req.query._method || req.method; //HTTP VERB override through query paramater (override through http header would be better)

    delete req.query._method;
    delete req.query._uuid;

    req.prepared = {
        uuid,
        clangObjectName,
        method,
    };

    console.log('req.prepared', req.prepared);

    next();
};
