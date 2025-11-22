/**
 * Lambda Handler
 */
exports.lambda = async (event, context) => {
    const { lambda } = require('./dist/index');
    return lambda(event, context);
};
