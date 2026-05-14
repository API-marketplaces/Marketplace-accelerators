# MonetizeMate Frontend

A modern, responsive Next.js web application for API monetization analytics and strategy recommendations. Built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (see Configuration section)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 3. Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 📋 What's Included

This Next.js application provides:

- **Authentication**: Secure login/signup with JWT tokens
- **Dashboard**: Real-time analytics and metrics visualization
- **File Upload**: Import CSV and Excel files with API metrics
- **Predictions**: ML-powered demand forecasting
- **Recommendations**: AI-generated monetization strategies
- **AI Concierge**: Chat-based assistant for monetization guidance
- **User Profile**: Manage user settings and preferences
- **Questionnaire**: Business requirement collection
- **Analytics Visualizations**: Charts, graphs, and data tables

## 🏗️ Project Structure

```
app/
├── layout.tsx                           # Root layout (navbar, footer, providers)
├── page.tsx                             # Home/landing page
├── providers.tsx                        # React providers (theme, auth, query)
├── globals.css                          # Global styles
├── nagarro-theme.css                    # Custom theme colors
│
├── (auth)/                              # Auth routes - not in main layout
│   ├── login/                           # Login page
│   └── signup/                          # Signup page
│
├── (public)/                            # Public routes
│   └── HomePage.tsx                     # Public homepage
│
├── api/                                 # Next.js API routes (backend-less APIs)
│   ├── analytics/                       # Analytics data routes
│   ├── auth/                            # Auth-related routes
│   ├── concierge/                       # Concierge/chat routes
│   ├── file/                            # File operations
│   └── uploads/                         # File upload handler
│
├── dashboard/                           # Dashboard pages
│   ├── analytics/                       # Analytics dashboard
│   ├── api-stats/                       # API statistics
│   ├── concierge/                       # AI concierge interface
│   ├── implementation/                  # Implementation guide
│   ├── prediction/                      # Predictions dashboard
│   ├── recommendation/                  # Recommendations page
│   ├── strategy-adviser/                # Strategy advisor
│   └── upload/                          # File upload page
│
├── components/                          # Reusable components
│   ├── AnomalyTable.tsx                 # Anomaly detection table
│   ├── ConciergeBubble.tsx              # Chat bubble component
│   ├── FileUpload.tsx                   # File upload form
│   ├── IndustrySelectionDialog.tsx      # Industry selector modal
│   ├── LoadingAnalysis.tsx              # Loading state
│   ├── LogoutButton.tsx                 # Logout button
│   ├── QuestionnaireCard.tsx            # Questionnaire card
│   ├── UserProfile.tsx                  # User profile display
│   └── ui/                              # shadcn/ui components (button, card, etc.)
│
├── hooks/                               # Custom React hooks
│   ├── useAnalytics.ts                  # Analytics data fetching
│   ├── useAuth.ts                       # Authentication logic
│   └── useFileHandler.ts                # File upload handling
│
├── services/                            # API client services
│   ├── analytics.service.ts             # Analytics API calls
│   ├── auth.ts                          # Authentication service
│   ├── fileService.ts                   # File operations
│   ├── prediction.service.ts            # Prediction API calls
│   └── ...                              # Other services
│
├── types/                               # TypeScript type definitions
│   ├── Analysis.ts                      # Analysis data types
│   ├── AnalyticsOverview.ts             # Overview types
│   ├── File.ts                          # File types
│   ├── MonetizationStrategy.ts          # Strategy types
│   ├── prediction.ts                    # Prediction types
│   └── ...                              # Other types
│
├── constants/                           # Application constants
│   ├── endpoints.ts                     # API endpoint URLs
│   ├── strategy-constants.ts            # Strategy constants
│   └── strategy-helpers.ts              # Helper functions
│
├── lib/                                 # Utility libraries
│   └── fetcher.ts                       # API request wrapper (SWR-compatible)
│
└── utils/                               # Utility functions
    └── file-parsers.ts                  # CSV/Excel parsing utilities

public/                                 # Static assets (images, icons)
```

## ⚙️ Configuration

### Environment Variables (.env.local)

Create a `.env.local` file in the frontend directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token

# Application
NEXT_PUBLIC_APP_NAME=MonetizeMate
```

### Configuration File Reference

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` | Change for production |
| `NEXT_PUBLIC_API_TIMEOUT` | Request timeout (ms) | `30000` | 30 seconds |
| `NEXT_PUBLIC_AUTH_TOKEN_KEY` | LocalStorage key for token | `auth_token` | Used in `useAuth()` hook |
| `NEXT_PUBLIC_APP_NAME` | Application name | `MonetizeMate` | Shown in UI |

### next.config.ts

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add any custom configuration here
};

export default nextConfig;
```

### staticwebapp.config.json

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  }
}
```

This ensures client-side routing works correctly on Azure Static Web Apps.

## 🏃 Available Scripts

### Development

```bash
npm run dev
# Starts dev server at http://localhost:3000
# Auto-reloads on code changes
```

### Production Build

```bash
npm run build
# Creates optimized production build in .next/
# Minifies code, optimizes images, etc.

npm start
# Serves production build locally
```

### Linting

```bash
npm run lint
# Checks code style with ESLint
# Fixes auto-fixable issues
```

## 📚 Project Dependencies

### Core Framework
- **Next.js 16**: React framework with SSR, SSG, API routes
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript

### State Management & Data Fetching
- **@tanstack/react-query (v5)**: Server state management, caching, synchronization
- **next/navigation**: Next.js router hooks

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components built on Radix UI
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Icon library
- **class-variance-authority**: CSS class variant management
- **clsx**: Utility for conditional classNames

### Forms & Validation
- **@hookform/resolvers**: Form validation resolvers
- **react-hook-form**: Performant flexible form validation

### Utilities
- **date-fns**: Modern date utility library
- **jsonwebtoken**: JWT token handling
- **embla-carousel-react**: Carousel component
- **input-otp**: OTP input component
- **cmdk**: Command menu component

## 🔐 Authentication Flow

1. **Signup**: User creates account with email/password
   - Validation on frontend and backend
   - Password hashed on backend

2. **Login**: User submits credentials
   - Backend validates and returns JWT token
   - Token stored in localStorage

3. **Protected Routes**: JWT token sent with each request
   - Token in `Authorization: Bearer <token>` header
   - Server validates token validity

4. **Logout**: Clear token from localStorage
   - Redirect to login page

### useAuth Hook

```typescript
const { user, token, login, signup, logout, isLoading } = useAuth();

// Use in components:
if (isLoading) return <Loading />;
if (!user) return <Login />;

return <Dashboard user={user} />;
```

## 📊 Key Features

### Dashboard Analytics
- Real-time API metrics visualization
- Time-series analysis charts
- Client segmentation analysis
- API rankings and top performers
- Statistical distribution views
- Anomaly detection alerts

### File Upload
- Supports CSV and Excel formats
- Drag-and-drop upload
- Data validation and parsing
- Preview before import
- Error handling and reporting

### Predictions
- ML-powered demand forecasting
- Historical trend analysis
- Confidence intervals
- Scenario planning

### Recommendations
- AI-generated monetization strategies
- Pricing recommendations
- Implementation roadmap
- ROI projections

### AI Concierge
- Chat-based assistant
- Real-time responses
- Conversation history
- Context-aware suggestions

## 🎨 Theming

### Current Theme
- **Primary Color**: Nagarro brand colors
- **Dark Mode Support**: Enabled with next-themes
- **Responsive Design**: Mobile, tablet, desktop

### Customize Theme
Edit `app/nagarro-theme.css` to modify colors, fonts, and spacing.

## 🧪 Component Examples

### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/services/analytics.service';

export function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

### Using Hooks

```typescript
import { useAuth } from '@/hooks/useAuth';

export function UserProfile() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🚀 Deployment

### Azure Static Web Apps

```bash
# Prerequisites
# 1. GitHub account with this repo
# 2. Azure account

# 1. Create Static Web App in Azure Portal
# 2. Configure GitHub Actions workflow
# 3. Push to main branch for auto-deploy
```

### Deployment Checklist

- ✅ Build succeeds: `npm run build`
- ✅ No TypeScript errors: Type checking passes
- ✅ Environment variables set in Azure
- ✅ API URL configured for production
- ✅ CORS enabled on backend
- ✅ Static assets optimized
- ✅ Security headers configured

## 🐛 Debugging

### Enable Debug Mode

```typescript
// In .env.local
NEXT_PUBLIC_DEBUG=true

// In components
if (process.env.NEXT_PUBLIC_DEBUG) {
  console.log('Debug info:', data);
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| API calls fail | Check `NEXT_PUBLIC_API_URL` in `.env.local` |
| Auth token not persisted | Check localStorage is enabled |
| Build fails | Run `npm install` and `npm run build` |
| Styles not loaded | Clear `.next/` and restart dev server |
| API timeout | Increase `NEXT_PUBLIC_API_TIMEOUT` |

## 📈 Performance Optimization

- **Image Optimization**: Next.js `Image` component
- **Code Splitting**: Automatic route-based splitting
- **CSS Optimization**: Tailwind CSS purging unused styles
- **API Caching**: React Query handles caching
- **Lazy Loading**: Dynamic imports for heavy components

```typescript
// Example: Lazy load heavy component
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>Loading...</div>,
});
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [React Query Documentation](https://tanstack.com/query/latest)

---

For the complete project setup and backend information, see the main [README.md](../README.md) in the project root.

**Version**: 1.0.0
**Last Updated**: May 2026
