# SaaS Feedback Platform Backend

Multi-tenant SaaS platform for collecting and managing user feedback.

## Features

- **Multi-tenancy**: Each company has isolated workspace
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Manager, User roles
- **REST API**: Clean RESTful API design
- **Comprehensive Logging**: Morgan + Winston for logging
- **Error Handling**: Centralized error handling
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet.js for security headers

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Winston** - Logging
- **Morgan** - HTTP request logger

## Project Structure

```
src/
├── config/         # Database and app configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Utility functions
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file from `.env.example`
4. Start MongoDB
5. Run development server: `npm run dev`

## Environment Variables

Copy `.env.example` to `.env` and update the values:

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `NODE_ENV` - Environment (development/production)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Companies
- `GET /api/companies` - Get user's companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Feedback
- `GET /api/feedback` - Get company feedback
- `POST /api/feedback` - Submit new feedback
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/feedback` - Get feedback analytics

## License

MIT
