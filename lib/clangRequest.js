const Clang = require('clang');
const clang = new Clang();
const createError = require('http-errors');

module.exports = (req, res, next, clangObjectName, clangMethodName, args) => {
    const fullMethodName = `${clangObjectName}_${clangMethodName}`;
    const fullArgs = { ...args, uuid: req.prepared.uuid };
    console.log('clangRequest', fullMethodName, fullArgs);

    clang.request(fullMethodName, fullArgs, (err, result) => {
        if (err) {
            let status = 500;
            if (
                err.Fault &&
                (err.Fault.faultcode == 213 ||
                    err.Fault.faultstring.match(/not found/i))
            ) {
                status = 404;
            }
            if (err.Fault) {
                next(createError(status, err.Fault));
            } else {
                next(
                    createError(status, {
                        message: err.message,
                        method: req.prepared.method,
                        params: req.params,
                    })
                );
            }
        }
        res.status(200).json(result);
    });
};
