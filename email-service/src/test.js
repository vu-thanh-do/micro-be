// Require packages
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import sendEmailNotification from "./service/sendMail.js";
import juice from 'juice';

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
  SYNC_COMPANY_STRUCTURE_SERVICE: "http://localhost:4001"
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
app.post('/auth/login', async (req, res) => {
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
// Get-me route
app.get('/auth/get-me', createServiceProxy(
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
  { '^/role/get-role-by-id/:id': (path, req)   => {
    const query = new URLSearchParams(req.query).toString();
    return `/role/get-role-by-id/${req.params.id}${query ? '?' + query : ''}`;
  } },
  10000
));

app.post('/role/create-role', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/role/create-role': '/api/create-role' },
  10000
));

app.put('/role/update-role/:id', createServiceProxy(
  SERVICES.AUTH_SERVICE,
  { '^/role/update-role/:id': '/api/update-role/:id' },
  10000
));
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
  { '^/files/get-files': (path, req) => {
    const query = new URLSearchParams(req.query).toString();
    return `/files/get-files${query ? '?' + query : ''}`;
  } },
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
  { '^/files/get-file-by-id/:id': (path, req) => {
    const query = new URLSearchParams(req.query).toString();
    return `/files/${req.params.id}${query ? '?' + query : ''}`;
  } },
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
app.post('/codeApproval/create',async(req,res)=>{
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
app.put('/codeApproval/update/:id',async(req,res)=>{
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
  { '^/language/get-all-group':(path, req)   => {
    const query = new URLSearchParams(req.query).toString();
    return `/language/get-all-group${query ? '?' + query : ''}`;
  } }
));
// all request recruitment
app.get('/requestRecruitment/department/get-all', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  { '^/requestRecruitment/department/get-all':(path, req)  => {
    const query = new URLSearchParams(req.query).toString();
    return `/requestRecruitment/department/get-all${query ? '?' + query : ''}`;
  } }
));
app.get('/requestRecruitment/department/:id', createServiceProxy(
  SERVICES.REQUEST_RECRUITMENT_SERVICE,
  { '^/requestRecruitment/department/:id':(path, req)  => {
    const query = new URLSearchParams(req.query).toString();
    return `/requestRecruitment/department/${req.params.id}${query ? '?' + query : ''}`;
  } }
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
  { '^/requestRecruitment/department/user/:id':(path, req)   => {
    const query = new URLSearchParams(req.query).toString();
    return `/requestRecruitment/department/user/${req.params.id}${query ? '?' + query : ''}`;
  } }
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
  { '^/requestRecruitment/mfgReplace/:id':(path, req)   => {
    const query = new URLSearchParams(req.query).toString();
    return `/requestRecruitment/mfgReplace/${req.params.id}${query ? '?' + query : ''}`;
  } }
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


// Form Template routes
app.get('/formTemplate', createServiceProxy(
  SERVICES.FORM_TEMPLATE_SERVICE,
  { '^/formTemplate': '/formTemplate' }
));
// Line Mfg routes
app.get('/lineMfg/getAllLineMfg', createServiceProxy(
  SERVICES.LINE_MFG_SERVICE,
  { '^/lineMfg/getAllLineMfg': (path, req) => {
    const query = new URLSearchParams(req.query).toString();
    return `/lineMfg/getAllLineMfg${query ? '?' + query : ''}`;
  } }
));
app.post('/lineMfg/createLine',  async (req, res) => {
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
// code approval

// resign
app.post('/resign/getInfoResign',async (req, res) => {
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
app.get('/notifications/admin', createServiceProxy(
  SERVICES.NOTI_SERVICE,
  { '^/notifications/admin': (path, req ) => {
    const query = new URLSearchParams(req.query).toString();
    return `/notifications/admin${query ? '?' + query : ''}`;
  } }
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
} );  

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
  { '^/sync-company-structure/all': (path, req)     => {
    const query = new URLSearchParams(req.query).toString();
    return `/sync-company-structure/all${query ? '?' + query : ''}`;
  } }
));
app.get('/sync-company-structure/search', createServiceProxy(
  SERVICES.SYNC_COMPANY_STRUCTURE_SERVICE,
  { '^/sync-company-structure/search': (path, req) => {
    const query = new URLSearchParams(req.query).toString();
    return `/sync-company-structure/search${query ? '?' + query : ''}`;
  } }
));
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
app.listen(PORT, '0.0.0.0',()  => {
  console.log(`Gateway is running on port ${PORT}`);
  console.log(`Auth service at: ${SERVICES.AUTH_SERVICE}`);
});