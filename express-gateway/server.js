const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 3000;
app.use('/login', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));
app.use('/notification', createProxyMiddleware({ target: 'http://localhost:4000', changeOrigin: true }));
app.listen(port, () => {
  console.log(`API Gateway running at http://localhost:${port}`);
});
