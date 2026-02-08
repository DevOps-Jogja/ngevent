# 🎉 NGEvent - Event Management Platform

Modern event management platform built with separate backend and frontend architecture for better scalability and deployment flexibility.

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🌟 Overview

NGEvent is a full-stack event management platform that allows users to:
- Browse and register for events
- Manage event registrations
- Create and manage events (organizers)
- Upload and manage media assets
- Send notifications and emails
- Track attendance and registration data

## 🛠️ Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + Google OAuth
- **Email**: Resend API
- **File Storage**: Cloudinary
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## 📁 Project Structure

```
ngevent/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Custom middlewares
│   │   ├── db/                # Database config & schema
│   │   ├── utils/             # Helper functions
│   │   └── index.ts           # Server entry point
│   ├── drizzle/               # Database migrations
│   ├── logs/                  # Application logs
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── README.md              # Backend documentation
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Route pages
│   │   ├── contexts/          # React contexts
│   │   ├── lib/               # Utilities & configs
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── README.md              # Frontend documentation
│
├── package.json               # Root package.json
├── PR_DESCRIPTION.md          # Pull request template
└── README.md                  # This file
```

## ✨ Features

### User Features
- 🔐 **Authentication**: Email/password + Google OAuth
- 📧 **Email Verification**: Secure account verification
- 🔑 **Password Reset**: Complete forgot/reset password flow
- 👤 **Profile Management**: Edit profile with avatar upload
- 🎫 **Event Registration**: Register for events with custom forms
- 📋 **Registration Management**: View and cancel registrations
- ♻️ **Re-registration**: Pre-filled forms when re-registering after cancellation
- 📱 **Responsive Design**: Mobile-friendly UI

### Organizer Features
- ➕ **Create Events**: Rich event creation with custom fields
- ✏️ **Edit Events**: Update event details and settings
- 🎤 **Speaker Management**: Add speakers with profiles
- 🖼️ **Media Gallery**: Custom image galleries for events
- 📊 **Registration Tracking**: View all registrations
- ✅ **Attendance Management**: Mark attendance status
- 📣 **Notifications**: Send updates to participants

### Admin Features
- 👥 **User Management**: Manage users and roles
- 📈 **Analytics Dashboard**: Event statistics
- 🔧 **System Configuration**: Platform settings

### Technical Features
- 🚀 **Client-Side Upload**: Direct browser-to-Cloudinary uploads
- 🔒 **Secure Signatures**: Server-side upload signature generation
- 📧 **Email Templates**: Branded email notifications
- 🔄 **Real-time Updates**: Optimistic UI updates with React Query
- 🌓 **Dark Mode**: Full dark mode support
- 📱 **PWA Ready**: Service worker for offline support
- 🎨 **Modern UI**: Clean design with Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- **Bun** >= 1.0.0 ([Install Bun](https://bun.sh))
- **PostgreSQL** >= 14
- **Node.js** >= 18 (optional, for npm-only packages)

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ngevent

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Environment
NODE_ENV=development
PORT=3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ngevent.git
cd ngevent
```

2. **Install dependencies**
```bash
# Install root dependencies
bun install

# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd ../frontend
bun install
```

3. **Setup environment variables**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

4. **Setup database**
```bash
cd backend

# Run migrations
bun run migrate

# Or using the migration script
./run-migration.sh
```

5. **Start development servers**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
bun run dev
# App runs on http://localhost:5173
```

## 💻 Development

### Available Scripts

#### Root
```bash
bun run dev          # Start both backend and frontend
bun run build        # Build both projects
bun run test         # Run all tests
```

#### Backend
```bash
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run start        # Start production server
bun run migrate      # Run database migrations
bun run test         # Run tests
```

#### Frontend
```bash
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint
```

### Database Migrations

```bash
cd backend

# Create new migration
bun run drizzle-kit generate:pg

# Run migrations
bun run migrate

# Using the helper script
./run-migration.sh
```

### Code Style

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** (optional) for code formatting

## 🚀 Deployment

### Vercel Deployment

The project is optimized for Vercel deployment with separate projects for backend and frontend.

#### Backend Deployment
```bash
cd backend
vercel --prod
```

#### Frontend Deployment
```bash
cd frontend
vercel --prod
```

See [backend/VERCEL_DEPLOY.md](backend/VERCEL_DEPLOY.md) for detailed deployment instructions.

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:

**Backend (Vercel):**
- `DATABASE_URL` (PostgreSQL connection string with SSL)
- `JWT_SECRET`
- `CLOUDINARY_*` variables
- `RESEND_API_KEY`
- `CORS_ORIGIN` (your frontend URL)
- `FRONTEND_URL` (your frontend URL)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `NODE_ENV=production`

**Frontend (Vercel):**
- `VITE_API_URL` (your backend URL)
- `VITE_CLOUDINARY_CLOUD_NAME`

## 📚 API Documentation

API documentation is available via Swagger UI when running the backend:

```
http://localhost:3000/api-docs
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google OAuth
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

#### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizer/admin)
- `PUT /api/events/:id` - Update event (organizer/admin)
- `DELETE /api/events/:id` - Delete event (organizer/admin)

#### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my-events` - Get user's registrations
- `GET /api/registrations/previous/:eventId` - Get previous registration
- `DELETE /api/registrations/:id` - Cancel registration
- `GET /api/registrations/event/:eventId` - Get event registrations (organizer)

#### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/:id` - Get user profile by ID

#### Upload
- `GET /api/upload/signature` - Get Cloudinary upload signature

See full API documentation at `/api-docs` endpoint.

## 🧪 Testing

```bash
# Run backend tests
cd backend
bun test

# Run frontend tests
cd frontend
bun test

# Run all tests
bun run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Developer**: [Your Name]
- **GitHub**: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Bun](https://bun.sh/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudinary](https://cloudinary.com/)
- [Resend](https://resend.com/)

## 📞 Support

For support, email support@ngevent.com or open an issue on GitHub.

---

**Made with ❤️ using Bun and modern web technologies**
