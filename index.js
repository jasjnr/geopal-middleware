const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

const GEO_API_KEY = process.env.GEO_API_KEY; // Your API Key
const EMPLOYEE_ID = process.env.EMPLOYEE_ID; // Your Employee ID

app.use(express.json());

app.use('/geopal/*', async (req, res) => {
  try {
    const timestamp = new Date().toUTCString();
    const method = req.method.toLowerCase();
    const path = req.originalUrl.replace('/geopal', '');
    const rawString = `${method}${path}${EMPLOYEE_ID}${timestamp}`.toLowerCase();

    const signature = crypto
      .createHmac('sha256', GEO_API_KEY)
      .update(rawString)
      .digest('base64');

    const geoHeaders = {
      'GEOPAL-TIMESTAMP': timestamp,
      'GEOPAL-EMPLOYEEID': EMPLOYEE_ID,
      'GEOPAL-SIGNATURE': signature
    };

    const geopalResponse = await axios({
      method: req.method,
      url: `https://app.geopalsolutions.com${path}`,
      headers: geoHeaders,
      data: req.body
    });

    res.status(geopalResponse.status).json(geopalResponse.data);

  } catch (error) {
    console.error(error.message);
    res.status(error.response?.status || 500).json({
      message: "Request failed",
      error: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log('GeoPal proxy running on http://localhost:3000');
});
