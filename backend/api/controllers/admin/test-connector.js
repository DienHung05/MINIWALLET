module.exports = async function testConnector(req, res) {
    const { connectorCode, operation, args } = req.allParams();
    if (!connectorCode || !operation) return res.fail(400, 'Thiếu connectorCode/operation' );
    try {
        const out = await sails.helpers.callConnector(connectorCode, operation, args || {}, 'test-' + Date.now());
        return res.ok({ result : out });
    } catch (e) {
        return res.fail(502, `${e.errorType || 'error'}: ${e.message || e}`);
    }
};