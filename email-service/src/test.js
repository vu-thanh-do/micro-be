// Require packages
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import sendEmailNotification from "./service/sendMail.js";
import multer from "multer";
import fetch from 'node-fetch';
import FormData from 'form-data';

const upload = multer({ storage: multer.memoryStorage() });
// Create an instance of Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware setup
app.use(cors({
  origin: [
    "http://localhost:3002",
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:4200",
    "http://localhost:4200/",
    "http://localhost:3002/",
    "http://10.73.131.60:5232",
    "http://10.73.131.60:5232/"
  ],
  credentials: true
}));
app.use(helmet());
app.use(morgan("combined"));
app.disable("x-powered-by");

// Service endpoints configuration
const SERVICES = {
  AUTH_SERVICE: "http://localhost:9988",
  CODE_APPROVAL_SERVICE: "http://localhost:4001",
  HEAD_COUNT_SERVICE: "http://localhost:4001",
  LANGUAGE_SERVICE: "http://localhost:4001",
  FORM_TEMPLATE_SERVICE: "http://localhost:4001",
  LOG_SERVICE: "http://localhost:4001",
  FILE_SERVICE: "http://localhost:3345",
  REQUEST_RECRUITMENT_SERVICE: "http://localhost:4001",
  LINE_MFG_SERVICE: "http://localhost:4001",
  NOTI_SERVICE: "http://localhost:4001",
  RESIGN_SERVICE: "http://localhost:4001",
  SYNC_COMPANY_STRUCTURE_SERVICE: "http://localhost:4001",
  ADOPTION_SERVICE: "http://localhost:4001",
};

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Function to create proxy middleware with timeout
const createServiceProxy = (targetUrl, pathRewrite = null, timeout = 30000) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: pathRewrite,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
      // Preserve original headers including authorization
      Object.keys(req.headers).forEach(key => {
        proxyReq.setHeader(key, req.headers[key]);
      });
      console.log('Original URL:', req.originalUrl);
      console.log('Proxied URL:', proxyReq.path);

      // If it's a POST/PUT with a body, handle body
      if (['POST', 'PUT'].includes(req.method) && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).json({
        code: 500,
        status: "Error",
        message: "Service unavailable or timeout",
        data: null
      });
    },
    proxyTimeout: timeout,
    timeout: timeout
  });
};

// Auth service routes with specific path rewrites
// Login route
app.post('/api/login', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to connect to authentication service",
      data: null
    });
  }
});
app.post('/auth/create-user', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to connect to authentication service",
      data: null
    });
  }
});
app.put('/auth/update-user/:id', async (req, res) => {
  try {
    const {id} = req.params
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/update-user/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to connect to authentication service",
      data: null
    });
  }
});
app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    const {id} = req.params
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/delete-user/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to connect to authentication service",
      data: null
    });
  }
});
// Get-me route
app.get('/auth/get-me', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/auth/get-me': '/api/get-user-from-token' },
  10000
));
app.get('/api/get-user-from-token', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/auth/get-me': '/api/get-user-from-token' },
  10000
));
// Refresh token route
app.post('/auth/refreshToken', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/auth/refreshToken': '/api/refreshToken' },
  10000
));
app.post('/api/refreshToken', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to refresh token",
      data: null
    });
  }
});
// Get all users route
app.get('/auth/get-all-users', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/auth/get-all-users': '/api/get-all-user' },
  10000
));
app.get('/role/get-role', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/role/get-role': '/api/get-role' },
  10000
));

app.get('/api/get-role-by-id/:id', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  {
    '^/role/get-role-by-id/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/role/get-role-by-id/${req.params.id}${query ? '?' + query : ''}`;
    }
  },
  10000
));

app.post('/api/create-role',async(req,res)=>{
try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/create-role`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify(req.body)
    })
    const data = await response.json(); 
    return res.status(response.status).json(data);
} catch (error) {
  console.error('Create Role Error:', error);
  return res.status(500).json({
    code: 500,
      status: "Error",
      message: "Failed to create role",
      data: null
    });
  }
});

app.put('/api/update-role/:id', async(req,res)=>{
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/update-role/${req.params.id}`,{
      method:'PUT',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify(req.body)
    })
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Update Role Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to update role",
      data: null
    });
  }
});
// logs
app.get('/logs/get-all-logs', createServiceProxy(
  SERVICES.LOG_SERVICE,
  {
    '^/logs/get-all-logs': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/logs${query ? '?' + query : ''}`;
    }
  },
  10000
));
// files
app.get('/files/get-files', createServiceProxy(
  SERVICES.FILE_SERVICE,
  {
    '^/files/get-files': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/files/get-files${query ? '?' + query : ''}`;
    }
  },
  10000
));
app.put('/files/update/:filename', createServiceProxy(
  SERVICES.FILE_SERVICE,
  { '^/files/update/:filename': '/files/update/:filename' },
  10000
));
app.get('/files/static-files/*', createProxyMiddleware({
  target: SERVICES.FILE_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/files/static-files': '/files'  // Chỉ rewrite phần prefix
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req) => {
    console.log('Original URL:', req.originalUrl);
    console.log('Proxied URL:', proxyReq.path);
  },
  // Thêm các headers cần thiết cho file download
  onProxyRes: (proxyRes, req, res) => {
    // Giữ nguyên content-type từ file service
    proxyRes.headers['content-type'] = proxyRes.headers['content-type'];
    // Cho phép download file
    proxyRes.headers['content-disposition'] = proxyRes.headers['content-disposition'];
  }
}));

app.delete('/files/delete-file', createServiceProxy(
  SERVICES.FILE_SERVICE,
  { '^/files/delete-file': '/files/delete-file' },
  10000
));
app.post('/files/upload', createServiceProxy(
  SERVICES.FILE_SERVICE,
  { '^/files/upload': '/files/upload' },
  10000
));
app.get('/files/get-file-by-id/:id', createServiceProxy(
  SERVICES.FILE_SERVICE,
  {
    '^/files/get-file-by-id/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/files/${req.params.id}${query ? '?' + query : ''}`;
    }
  },
  10000
));
// Code Approval routes
app.get('/codeApproval', createServiceProxy(
  SERVICES.CODE_APPROVAL_SERVICE,
  { '^/codeApproval': '/codeApproval' }
));
app.get('/codeApproval/get-by-id/:id', createServiceProxy(
  SERVICES.CODE_APPROVAL_SERVICE,
  { '^/codeApproval/get-by-id/:id': '/codeApproval/get-by-id/:id' }
));
app.post('/codeApproval/create', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.CODE_APPROVAL_SERVICE}/codeApproval/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Code Approval Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create code approval",
      data: null
    });
  }
});
app.put('/codeApproval/update/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.CODE_APPROVAL_SERVICE}/codeApproval/update/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Update Code Approval Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to update code approval",
      data: null
    });
  }
});


// Head Count routes
app.use('/headCount', createServiceProxy(
  SERVICES.HEAD_COUNT_SERVICE,
  { '^/headCount': '/headCount' }
));

// Language routes
app.get('/language', createServiceProxy(
  SERVICES.LANGUAGE_SERVICE,
  {
    '^/language': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/language${query ? '?' + query : ''}`;
    }
  }
));
app.get('/language/get-all-group', createServiceProxy(
  SERVICES.LANGUAGE_SERVICE,
  {
    '^/language/get-all-group': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/language/get-all-group${query ? '?' + query : ''}`;
    }
  }
));
// all request recruitment
app.get('/requestRecruitment/department/get-all', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  {
    '^/requestRecruitment/department/get-all': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/requestRecruitment/department/get-all${query ? '?' + query : ''}`;
    }
  }
));
app.get('/pendingApproval/user/:id', (req, res, next) => {
  const id = req.params.id;
  const query = new URLSearchParams(req.query).toString();
  const targetPath = `/pendingApproval/user/${id}${query ? '?' + query : ''}`;
  req.url = targetPath;
  createServiceProxy(SERVICES.REQUEST_RECRUITMENT_SERVICE)(req, res, next);
});


app.get('/requestRecruitment/department/:id', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  {
    '^/requestRecruitment/department/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/requestRecruitment/department/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));
app.put('/requestRecruitment/update-processing/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/update-processing/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Update Request Recruitment Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to update request recruitment",
      data: null
    });
  }
});

app.post('/requestRecruitment/department/create', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/department/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Request Recruitment Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create request recruitment",
      data: null
    });
  }
});
app.get('/requestRecruitment/department/user/:id', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  {
    '^/requestRecruitment/department/user/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/requestRecruitment/department/user/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));
app.put('/requestRecruitment/department/edit/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/department/edit/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Edit Request Recruitment Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to edit request recruitment",
      data: null
    });
  }
});
app.put('requestRecruitment/department/revise/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/department/revise/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Revise Request Recruitment Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to revise request recruitment",
      data: null
    });
  }
});
app.post('/requestRecruitment/department/approve', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/department/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Request Recruitment Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create request recruitment",
      data: null
    });
  }
});
// mfg replace
app.post('/requestRecruitment/mfgReplace/create', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgReplace/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Mfg Replace Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create mfg replace",
      data: null
    });
  }
});
app.put('/requestRecruitment/mfgReplace/edit/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgReplace/edit/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Edit Mfg Replace Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to edit mfg replace",
      data: null
    });
  }
});
app.get('/requestRecruitment/mfgReplace/:id', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  {
    '^/requestRecruitment/mfgReplace/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/requestRecruitment/mfgReplace/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));

app.post('/requestRecruitment/mfgReplace/approve', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgReplace/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Approve Mfg Replace Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to approve mfg replace",
      data: null
    });
  }
});
app.post('/requestRecruitment/mfgReplace/revise/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgReplace/revise/${req.params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Revise Mfg Replace Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to revise mfg replace",
      data: null
    });
  }
});
app.delete('/requestRecruitment/mfgReplace/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgReplace/${req.params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete Mfg Replace Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to delete mfg replace",
      data: null
    });
  }
});
// mfg new 
app.post('/requestRecruitment/mfgNew/create', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgNew/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Mfg New Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create mfg new",
      data: null
    });
  }
});
app.get('/requestRecruitment/mfgNew/:id', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  {
    '^/requestRecruitment/mfgNew/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/requestRecruitment/mfgNew/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));
app.put('/requestRecruitment/mfgNew/edit/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgNew/edit/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Edit Mfg New Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to edit mfg new",
      data: null
    });
  }
});
app.post('/requestRecruitment/mfgNew/approve', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgNew/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Approve Mfg New Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to approve mfg new",
      data: null
    });
  }
});
app.put('/requestRecruitment/mfgNew/revise/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/mfgNew/revise/${req.params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout  
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Revise Mfg New Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to revise mfg new",
      data: null
    });
  }
});


// Form Template routes
app.get('/formTemplate/get-name-structure', createServiceProxy(
  SERVICES.FORM_TEMPLATE_SERVICE,
  {
    '^/formTemplate/get-name-structure': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/formTemplate/get-name-structure${query ? '?' + query : ''}`;
    }
  }
));
app.get('/formTemplate/get-by-id/:id', createServiceProxy(
  SERVICES.FORM_TEMPLATE_SERVICE,
  {
    '^/formTemplate/get-by-id/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/formTemplate/get-by-id/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));
// Line Mfg routes
app.get('/lineMfg/getAllLineMfg', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  {
    '^/lineMfg/getAllLineMfg': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/lineMfg/getAllLineMfg${query ? '?' + query : ''}`;
    }
  }
));
app.post('/lineMfg/createLine', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.LINE_MFG_SERVICE}/lineMfg/createLine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Line Mfg Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to create line mfg",
      data: null
    });
  }
});
app.put('/lineMfg/updateLine/:id', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  { '^/lineMfg/updateLine/:id': '/lineMfg/updateLine/:id' }
));
app.post('/lineMfg/toggleLine/:id', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  { '^/lineMfg/toggleLine/:id': '/lineMfg/toggleLine/:id' }
));
app.post('/lineMfg/importExcel', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  { '^/lineMfg/importExcel': '/lineMfg/importExcel' }
));
app.get('/lineMfg/downloadTemplate', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  { '^/lineMfg/downloadTemplate': '/lineMfg/downloadTemplate' }
));
app.get('/requestRecruitment/mfgNew/export-template-mfg-new', async (req, res) => {
  try {
    const url = `${LINE_MFG_SERVICE}/requestRecruitment/mfgNew/export-template-mfg-new`;
    const response = await axios.get(url, {
      responseType: 'arraybuffer', // quan trọng để nhận file binary
    });
    // Forward header để trình duyệt hiểu đây là file
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment; filename="template.xlsx"');
    // Gửi file về
    return res.send(response.data);
  } catch (error) {
    console.error('Lỗi khi proxy file Excel:', error);
    return res.status(500).json({
      status: 500,
      message: 'Không thể tải file template MFG',
      error: error?.message || 'Unknown error',
    });
  }
});
// code approval

// resign
app.post('/resign/create-resign-specific',async(req,res)=>{
  try{
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/create-resign-specific`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  }catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Không thể tải ',
      error: error?.message || 'Unknown error',
    });
  }
})
app.post('/resign/delete-multiple-employees',async(req,res)=>{
  try{
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/delete-multiple-employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  }catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Không thể tải ',
      error: error?.message || 'Unknown error',
    });
  }
})
app.delete('/resign/resign-specific/:deptName/:employeeId', async (req, res) => {
  const { deptName, employeeId } = req.params; // Lấy tham số từ URL
  try {
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/resign-specific/${deptName}/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      timeout: 10000, // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Không thể tải',
      error: error?.message || 'Unknown error',
    });
  }
});
app.delete('/resign/resign-specific/:deptName', async (req, res) => {
  const { deptName } = req.params; // Lấy tham số từ URL
  try {
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/resign-specific/${deptName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      timeout: 10000, // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Không thể tải',
      error: error?.message || 'Unknown error',
    });
  }
});

app.post('/resign/getInfoResign', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/getInfoResign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Get Info Resign Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to get info resign",
      data: null
    });
  }
});
app.post('/resign/get-resign-specific', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.RESIGN_SERVICE}/resign/get-resign-specific`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Get Info Resign Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to get info resign",
      data: null
    });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      auth: SERVICES.AUTH_SERVICE,
      codeApproval: SERVICES.CODE_APPROVAL_SERVICE,
      headCount: SERVICES.HEAD_COUNT_SERVICE,
      language: SERVICES.LANGUAGE_SERVICE,
      formTemplate: SERVICES.FORM_TEMPLATE_SERVICE,
      lineMfg: SERVICES.LINE_MFG_SERVICE
    }
  });
});
// noti 
app.get('/notifications/users/:id', createServiceProxy(
  SERVICES.NOTI_SERVICE,
  {
    '^/notifications/users/:id': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/notifications/users/${req.params.id}${query ? '?' + query : ''}`;
    }
  }
));
app.get('/notifications/admin', createServiceProxy(
  SERVICES.NOTI_SERVICE,
  {
    '^/notifications/admin': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/notifications/admin${query ? '?' + query : ''}`;
    }
  }
));
app.post('/notifications/mark-read/:id', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.NOTI_SERVICE}/notifications/mark-read/${req.params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Mark Read Notification Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to mark read notification",
      data: null
    });
  }
});

// mailer 
app.post('/send-email', async (req, res) => {
  try {
    const result = await sendEmailNotification({
      to: 'vu.thanh.do.a7y@ap.denso.com',
      subject: 'Chào mừng bạn đến với hệ thống',
      templateName: 'createRequestRecruit', // tương ứng với file `./template/welcome.hbs`
      context: {
        username: 'Nguyễn Văn A',
        link: 'https://example.com/kich-hoat',
      },
    });
    console.log(result);
    return res.json('ok');
  } catch (error) {
    console.error('Send Email Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to send email",
      data: null
    });
  }
});
// sync company structure
app.get('/sync-company-structure', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  { '^/sync-company-structure': '/sync-company-structure' }
));
app.get('/sync-company-structure/all', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  {
    '^/sync-company-structure/all': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/sync-company-structure/all${query ? '?' + query : ''}`;
    }
  }
));
app.get('/sync-company-structure/search', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  {
    '^/sync-company-structure/search': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/sync-company-structure/search${query ? '?' + query : ''}`;
    }
  }
));
app.get('/sync-company-structure/all-department-version-2', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  {
    '^/sync-company-structure/all-department-version-2': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/sync-company-structure/all-department-version-2${query ? '?' + query : ''}`;
    }
  }
));
app.get('/sumary-department/detail-sumary', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  {
    '^/sumary-department/detail-sumary': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/sumary-department/detail-sumary${query ? '?' + query : ''}`;
    }
  }
));
app.post('/sumary-department/add-adjust', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE}/sumary-department/add-adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Add Adjust Error:', error);
    return res.status(500).json({
      code: 500,
      status: "Error",
      message: "Failed to add adjust",
      data: null
    });
  }
});
app.get('/sumary-department/info-headcount', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  {
    '^/sumary-department/info-headcount': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/sumary-department/info-headcount${query ? '?' + query : ''}`;
    }
  }
));
// adoption


app.get('/adoption/getAll-recode', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/getAll-recode': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/getAll-recode${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/get-adoption-details/:adoptionId', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/get-adoption-details/:adoptionId': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/get-adoption-details/${req.params.adoptionId}${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/get-adoption/:adoptionId', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/get-adoption/:adoptionId': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/get-adoption/${req.params.adoptionId}${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/getall-adoption-user/:userId', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/getall-adoption-user/:userId': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/getall-adoption-user/${req.params.adoptionId}${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/getAll-adoption-admin', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/getAll-adoption-admin': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/getAll-adoption-admin${query ? '?' + query : ''}`;
    }
  }
));
app.get('/history-approve', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/history-approve': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/history-approve${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/load-recCode', createServiceProxy(
  SERVICES.ADOPTION_SERVICE,
  {
    '^/adoption/load-recCode': (path, req) => {
      const query = new URLSearchParams(req.query).toString();
      return `/adoption/load-recCode${query ? '?' + query : ''}`;
    }
  }
));
app.get('/adoption/export-data-adoption', async (req, res) => {
  try {
    const { adoptionId, batchNumber } = req.query;

    if (!adoptionId) {
      return res.status(400).json({ status: 400, message: 'Thiếu adoptionId', data: null });
    }
    const queryString = new URLSearchParams({ adoptionId, batchNumber: batchNumber || '0' }).toString();
    const targetUrl = `${SERVICES.ADOPTION_SERVICE}/adoption/export-data-adoption?${queryString}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      timeout: 10000,
    });

    if (!response.ok) {
      const errorJson = await response.json();
      return res.status(response.status).json(errorJson);
    }
    res.set({
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="export.xlsx"',
    });
    response.body.pipe(res);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Lỗi gateway khi xuất dữ liệu adoption',
      error: error.message,
    });
  }
});
app.post('/adoption/create-adoption-version-hr', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.ADOPTION_SERVICE}/adoption/create-adoption-version-hr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Adoption Version Hr Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to create adoption version hr',
      data: null
    });
  }
});
app.post('/adoption/create-adoption-batch/:adoptionId', async (req, res) => {
  try {
    const adoptionId = req.params.adoptionId
    const response = await fetch(`${SERVICES.ADOPTION_SERVICE}/adoption/create-adoption-batch/` + adoptionId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Create Adoption Version Hr Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to create adoption version hr',
      data: null
    });
  }
})
app.post('/adoption/import-adoption-version-hr', upload.single('file'), async (req, res) => {
  try {
    const form = new FormData();
    // 👇 append file vào form
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    // 👇 gửi request tới service gốc
    const response = await fetch(`${SERVICES.ADOPTION_SERVICE}/adoption/import-adoption-version-hr`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 10000
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Import Adoption Version Hr Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to import adoption version hr',
      data: null
    });
  }
});
app.post('/adoption/import-adoption-version-user', upload.single('file'), async (req, res) => {
  try {
    const form = new FormData();
    // 👇 append file vào form
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    // 👇 gửi request tới service gốc
    const response = await fetch(`${SERVICES.ADOPTION_SERVICE}/adoption/import-adoption-version-user`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 10000
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Import Adoption Version User Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to import adoption version user',
      data: null
    });
  }
});
app.post('/requestRecruitment/update-rec-code', async (req, res) => {
  try {
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/update-rec-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Update Rec Code Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to update rec code',
      data: null
    });
  }
});
app.post('/requestRecruitment/hrAnswer/:reqDepartmenrId', async (req, res) => {
  try {
    const { reqDepartmenrId } = req.params
    const response = await fetch(`${SERVICES.REQUEST_RECRUITMENT_SERVICE}/requestRecruitment/hrAnswer/${reqDepartmenrId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      timeout: 10000 // 10 seconds timeout
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Update Rec Code Error:', error);
    return res.status(500).json({
      code: 500,
      status: 'Error',
      message: 'Failed to update rec code',
      data: null
    });
  }
});
// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    code: 404,
    status: "Error",
    message: "Route not found.",
    data: null,
  });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    code: 500,
    status: "Error",
    message: "Internal server error",
    data: null,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway is running on port ${PORT}`);
  console.log(`Auth service at: ${SERVICES.AUTH_SERVICE}`);
});