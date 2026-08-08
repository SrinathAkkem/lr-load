# RonoHub LR Load v2

Version 2.0 of the RonoHub LR management web application with redesigned UI based on new Figma specifications.

## What's New in v2

### UI/UX Improvements
- **Redesigned Company Admin Login Screen**: Clean, modern interface with improved visual hierarchy
- **Updated Color Scheme**: 
  - Light purple background (#F2EFFA) on left panel
  - Primary purple (#5E3EA1) for brand elements
  - Solid black buttons replacing gradient buttons for better contrast
- **Enhanced Typography**: Using Host Grotesk font family for improved readability
- **Improved Form Design**: 
  - Larger input fields (54px height) with softer backgrounds (#F5F5F7)
  - Better spacing and alignment
  - Centered content layout for better focus
- **Simplified OTP Flow**: Integrated OTP input within the same page flow

### Technical Stack
Same robust technical foundation as v1:
- **Framework**: Next.js 15 (App Router)
- **Database**: Prisma ORM with MySQL
- **UI Components**: Radix UI + Custom components
- **Styling**: Tailwind CSS v4
- **Authentication**: OTP-based login
- **Payment**: Razorpay integration

## Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL database
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your database and API keys in .env.local

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000/company/login` to see the new login interface.

### Environment Variables
Check `.env.example` for required environment variables including:
- Database connection
- JWT secrets
- SMS/OTP configuration
- Razorpay keys
- File upload settings

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (unchanged from v1)
│   ├── company/      # Company admin portal
│   │   └── login/    # NEW: Redesigned login page
│   ├── super-admin/  # Super admin portal
│   └── legal/        # Legal pages
├── components/       # Reusable components
├── lib/             # Utility functions and configs
└── hooks/           # Custom React hooks
```

## API Routes (Unchanged from v1)

All API endpoints remain fully compatible with v1:
- `/api/auth/*` - Authentication endpoints
- `/api/lr/*` - LR management
- `/api/company/*` - Company operations
- `/api/executives/*` - Executive management
- `/api/reports/*` - Report generation
- And more...

## Design System

### Colors
- **Primary Purple**: `#5E3EA1`
- **Secondary Purple**: `#8B359E`
- **Light Purple Background**: `#F2EFFA`
- **Text Primary**: `#000000`
- **Text Secondary**: `#4D4D4D`
- **Input Background**: `#F5F5F7`

### Typography
- **Font Family**: Host Grotesk (fallback to system fonts)
- **Heading**: 30px, Bold
- **Body**: 16px, Normal
- **Small Text**: 14px, Normal

### Components
- **Input Fields**: Rounded (12px), 54px height, light gray background
- **Buttons**: Rounded (12px), solid black with white text
- **Spacing**: Consistent 8px grid system

## Migration from v1

The v2 UI is a drop-in replacement. All existing API integrations, database schemas, and backend logic remain unchanged. Only the frontend login experience has been redesigned.

### Breaking Changes
None - All APIs are backward compatible.

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## License

Private - RonoHub

## Support

For issues or questions, contact the RonoHub development team.
