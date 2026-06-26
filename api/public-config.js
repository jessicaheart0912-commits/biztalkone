module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({
    appUrl: process.env.APP_BASE_URL || '',
    aiProxyEnabled: Boolean(process.env.OPENAI_API_KEY),
    payappEnabled: Boolean(process.env.PAYAPP_USERID && process.env.PAYAPP_SHOPNAME),
    payapp: {
      userid: process.env.PAYAPP_USERID || '',
      shopname: process.env.PAYAPP_SHOPNAME || ''
    }
  });
};
