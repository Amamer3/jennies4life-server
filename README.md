# Jennies4life Backend API

A complete backend system for an affiliate marketing website built with TypeScript, Node.js, Express, Firebase Authentication, and Firestore.

## 🔧 Tech Stack

- **Language**: TypeScript
- **Framework**: Node.js + Express
- **Authentication**: Firebase Authentication (Admin Only)
- **Database**: Firebase Firestore
- **Hosting**: Render
- **API Docs**: Scalar (OpenAPI spec)

## 📌 Features

### Admin Dashboard (Secure)
- CRUD operations on Affiliate Products
- CRUD operations on Blog Posts
- Firebase Authentication for admin access
- Token-based authorization

### Public-Facing Website (No Auth)
- Read-only access to published products
- Read-only access to published blog posts
- Open endpoints for public consumption

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Firebase service account credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jennies4life-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Firebase Admin SDK Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
   
   # Admin Configuration
   ADMIN_EMAIL=admin@jennies4life.com
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Or start the production server:
   ```bash
   npm start
   ```

## 📚 API Documentation

The API documentation is available in OpenAPI 3.0 format in `openapi.yaml`. You can view it using:

- **Scalar**: Upload the `openapi.yaml` file to [Scalar](https://scalar.com)
- **Swagger UI**: Use any OpenAPI viewer
- **Postman**: Import the OpenAPI spec

### Base URLs
- Development: `http://localhost:3000`
- Production: `https://your-render-app.onrender.com`

## 🔄 API Endpoints

### 🔓 Public Endpoints (No Auth Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | Get all published products |
| GET | `/api/products/:slug` | Get one product by slug |
| GET | `/api/posts` | Get all published blog posts |
| GET | `/api/posts/:slug` | Get one blog post by slug |
| GET | `/api/health` | Health check endpoint |

### 🔒 Admin Endpoints (Auth Required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/products` | Create a new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/posts` | Create new blog post |
| PUT | `/api/posts/:id` | Update blog post |
| DELETE | `/api/posts/:id` | Delete blog post |

## 🔐 Authentication

Admin endpoints require Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

The middleware validates:
1. Token authenticity using Firebase Admin SDK
2. User email matches the configured admin email

## 🗃️ Data Models

### Products Collection (`products`)
```typescript
{
  name: string;
  slug: string; // for routing
  image: string;
  description: string;
  affiliateLink: string;
  category: string;
  status: "draft" | "published";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Blog Posts Collection (`posts`)
```typescript
{
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: "draft" | "published";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🧪 Testing the API

### Using curl

**Get published products:**
```bash
curl http://localhost:3000/api/products
```

**Create a product (admin):**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "name": "Amazing Product",
    "image": "https://example.com/image.jpg",
    "description": "This is an amazing product!",
    "affiliateLink": "https://affiliate.com/product/123",
    "category": "Electronics",
    "status": "published"
  }'
```

### Using Postman

1. Import the `openapi.yaml` file
2. Set up environment variables for base URL and auth token
3. Test all endpoints with proper authentication

## 🚀 Deployment on Render

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure build and start commands:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Set environment variables** in Render dashboard
5. **Deploy**

### Environment Variables for Render

Add all the variables from your `.env` file to Render's environment variables section. Make sure to:

- Set `NODE_ENV=production`
- Update `ALLOWED_ORIGINS` with your frontend domain
- Ensure all Firebase credentials are properly set

## 📁 Project Structure

```
/src
  ├── controllers/          # Request handlers
  │   ├── productsController.ts
  │   └── postsController.ts
  ├── routes/              # Route definitions
  │   ├── index.ts
  │   ├── products.ts
  │   └── posts.ts
  ├── middleware/          # Custom middleware
  │   └── authMiddleware.ts
  ├── services/           # External services
  │   └── firebase.ts
  ├── utils/              # Utilities and types
  │   ├── types.ts
  │   └── helpers.ts
  └── app.ts              # Main application file
```

## 🔧 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Watch for TypeScript changes

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Firebase Auth**: Secure token validation
- **Input Validation**: Required field validation
- **URL Validation**: Affiliate link and image URL validation
- **Admin-only Access**: Restricted admin operations

## 🐛 Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (non-admin access)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

All errors return a consistent format:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email admin@jennies4life.com or create an issue in the repository.