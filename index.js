const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

const GEO_API_KEY = process.env.GEO_API_KEY;
const EMPLOYEE_ID = process.env.EMPLOYEE_ID;
const SHARED_SECRET = process.env.SHARED_SECRET;

app.use(express.json());

// Optional: shared secret header check (add SHARED_SECRET env var in Render)
app.use('/geopal/*', (req, res, next) => {
  const clientSecret = req.headers['x-middleware-secret'];
  if (SHARED_SECRET && clientSecret !== SHARED_SECRET) {
    return res.status(403).json({ error: 'Forbidden - Invalid shared secret' });
  }
  next();
});

app.use('/geopal/*', async (req, res) => {
  try {
    const timestamp = new Date().toUTCString(); // RFC 2822 format
    const method = req.method.toLowerCase();
    const path = req.originalUrl.replace('/geopal', '');
    const rawString = `${method}${path}${EMPLOYEE_ID}${timestamp}`.toLowerCase();

    const signature = crypto
      .createHmac('sha256', GEO_API_KEY)
      .update(rawString)
      .digest('base64');

    // DEBUG LOGGING — Remove when verified
    console.log('--- GeoPal Middleware Request ---');
    console.log('Timestamp:', timestamp);
    console.log('Method:', method);
    console.log('URI:', path);
    console.log('Employee ID:', EMPLOYEE_ID);
    console.log('Raw String:', rawString);
    console.log('Signature:', signature);
    console.log('---------------------------------');

const geoHeaders = {
  'GEOPAL-TIMESTAMP': timestamp,
  'GEOPAL-EMPLOYEEID': EMPLOYEE_ID,
  'GEOPAL-SIGNATURE': signature,
  'Accept': 'application/json' // ⬅️ Force JSON response
};

const geopalResponse = await axios({
  method: req.method,
  url: `https://app.geopalsolutions.com${path}`,
  headers: geoHeaders,
  data: req.body
});

    res.status(geopalResponse.status).json(geopalResponse.data);

  } catch (error) {
    console.error('GeoPal API Error:', error.message);
    if (error.response) {
      console.error('GeoPal Response Body:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      message: "Request failed",
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GeoPal proxy running on port ${PORT}`);
});
