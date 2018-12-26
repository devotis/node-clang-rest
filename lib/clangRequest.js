const Clang = require('clang');
const clang = new Clang();
const createError = require('http-errors');

exports.clangRequest = (
    req,
    res,
    next,
    clangObjectName,
    clangMethodName,
    args
) => {
    clang.request(
        clangObjectName + '_' + clangMethodName,
        { ...args, uuid: req.prepared.uuid },
        (err, result) => {
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
        }
    );
};
