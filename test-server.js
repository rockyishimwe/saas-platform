// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const morgan = require('morgan');

// // Initialize Express app
// const app = express();

// // Security middleware
// app.use(helmet());
// app.use(cors({
//   origin: ['http://localhost:3000', 'https://yourdomain.com'],
//   credentials: true
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api', limiter);

// // Logging middleware
// app.use(morgan('combined'));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     message: 'SaaS Backend API is running!'
//   });
// });

// // Test endpoints
// app.get('/api/test', (req, res) => {
//   res.json({
//     success: true,
//     message: 'API is working!',
//     data: {
//       version: '1.0.0',
//       environment: process.env.NODE_ENV || 'development'
//     }
//   });
// });

// // Test authentication endpoint (mock)
// app.post('/api/test/auth', (req, res) => {
//   const { email, password } = req.body;
  
//   if (email && password) {
//     res.json({
//       success: true,
//       message: 'Mock authentication successful',
//       data: {
//         user: {
//           id: 'mock-user-id',
//           email,
//           firstName: 'Test',
//           lastName: 'User',
//           role: 'admin'
//         },
//         token: 'mock-jwt-token'
//       }
//     });
//   } else {
//     res.status(400).json({
//       success: false,
//       message: 'Email and password required'
//     });
//   }
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     message: 'Internal Server Error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//   });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Test Server running on port ${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/health`);
//   console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
//   console.log(`🔐 Test auth: http://localhost:${PORT}/api/test/auth`);
// });

// module.exports = app;
