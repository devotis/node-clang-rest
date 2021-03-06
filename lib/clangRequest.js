const Clang = require('clang');
const clang = new Clang({
    normalizeOptionFields: true,
});
const createError = require('http-errors');

const manualFieldRegex = /{{manual field='([^']*)'}}/g;
const getManualFields = string => {
    // https://stackoverflow.com/a/24795131/1385429
    const matches = [];
    string.replace(manualFieldRegex, (m, p1) => {
        matches.push(p1);
    });
    return matches;
};

const handleError = (err, req, next) => {
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
                message: typeof err === 'string' ? err : err.message,
                method: req.prepared.method,
                params: req.params,
            })
        );
    }
};

module.exports = async (
    req,
    res,
    next,
    clangObjectName,
    clangMethodName,
    args
) => {
    const fullMethodName = `${clangObjectName}_${clangMethodName}`;
    const fullArgs = { ...args, uuid: req.prepared.uuid };

    // Check of er manual options missen, want email_sendToCustomer doet die check niet
    // Zie: https://github.com/leadstoloyals/aspnet-tickl-app/issues/464
    if (fullMethodName === 'email_sendToCustomer') {
        try {
            const result = await clang.request('email_getById', {
                uuid: fullArgs.uuid,
                emailId: fullArgs.emailId,
            });

            Object.entries(result).forEach(([key, value]) => {
                if (typeof value !== 'string') return;
                const manualFields = getManualFields(value);
                if (!manualFields.length) return;

                manualFields.forEach(manualField => {
                    if (fullArgs[manualField] == null) {
                        throw new Error(
                            `Manual field '${manualField}' required by '${key}' of email ${
                                fullArgs.emailId
                            } is missing in the arguments. Include '${manualField}' in the POSTed object to fix this.`
                        );
                    }
                });
            });
        } catch (err) {
            handleError(err, req, next);
            return; // stop requesting email_sendToCustomer
        }
    }

    try {
        const result = await clang.request(fullMethodName, fullArgs);
        res.status(200).json(result);
    } catch (err) {
        handleError(err, req, next);
    }
};
