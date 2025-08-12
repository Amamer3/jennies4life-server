import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import productsRoutes from './products';
import postsRoutes from './posts';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import redirectRoutes from './redirect';
import adminRoutes from './admin';
import categoriesRoutes from './categories';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/posts', postsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/redirect', redirectRoutes);
router.use('/admin', adminRoutes);

// API Documentation endpoint with Scalar
router.get('/docs', (req, res) => {
  try {
    const openApiPath = join(__dirname, '../../openapi.yaml');
    const openApiSpec = readFileSync(openApiPath, 'utf8');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Jennies4life API Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/docs/spec"
    data-configuration='{
      "theme": "purple",
      "layout": "modern",
      "showSidebar": true,
      "hideDownloadButton": false,
      "searchHotKey": "k"
    }'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load API documentation'
    });
  }
});

// OpenAPI spec endpoint for Scalar
router.get('/docs/spec', (req, res) => {
  try {
    const openApiPath = join(__dirname, '../../openapi.yaml');
    const openApiSpec = readFileSync(openApiPath, 'utf8');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(openApiSpec);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load API specification'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Jennies4life API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;