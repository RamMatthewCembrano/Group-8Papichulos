# Papicholos Order Management System

A full-stack, real-time restaurant ordering and management system designed for both dine-in and pickup customers. The application features a sleek customer-facing menu and a powerful administrative dashboard, all synced instantly using WebSockets.

## Key Features

### Customer Experience
- **Interactive Menu & Persistent Cart**: Browse food items by category, view dynamic prices, and manage quantities in a slide-out cart that saves your progress locally.
- **Flexible Ordering**: Support for **Dine-In** (scan table QR code or select manually) and **Store Pickup** (auto-generated pickup codes).
- **Payment Integration**: Choose between "Pay at Counter" or "GCash" (includes a receipt image upload feature and easy-copy GCash details).
- **Live Order Tracking**: A floating status bar and an animated full-screen stepper track your order in real-time ("Pending" → "Preparing" → "Ready to Serve" → "Completed").
- **Order History**: Track past and active orders directly on the device.
- **Dynamic Footer Carousel**: Infinite scrolling image carousel at the bottom of the page showing promos, sponsors, or food photography.
- **Smart Session Management**: For shared Dine-In devices, inactive sessions automatically reset after 4 hours to ensure privacy for the next customer.

### Admin Dashboard
- **Real-Time Kanban Board**: Live view of incoming orders with advanced filtering combinations (Status + Order Type). Admins can move orders through the preparation pipeline with a single click.
- **Menu Management**: Full CRUD interface to add, edit, or delete menu items and categories. Features drag-and-drop category reordering, inline category renaming, direct cloud image uploads, and dynamic availability toggling.
- **Carousel Management**: Manage the footer image carousel (upload/delete images, toggle visibility, and adjust scroll speeds).
- **Table & QR Code Manager**: Manage active tables and automatically generate downloadable QR codes that map directly to the table's ordering link.
- **Order History & Reversal**: View all past orders, filter by status, and securely restore accidentally cancelled orders (password protected).
- **Admin Action Logs**: Comprehensive system audit log that tracks who changed what (e.g. menu edits, order status updates, setting changes) with human-readable timestamps.
- **Store Settings**: Dynamically update store-wide settings such as checkout fees and GCash payment details.

### System Architecture & Optimizations
- **Client-Side Image Compression**: Heavy integration of `browser-image-compression` to drastically reduce file sizes for GCash receipts, menu items, and carousel images *before* they upload, protecting storage limits.
- **Automated Storage Cleanup**: Orphaned images are automatically deleted from Supabase Storage when their corresponding database rows are removed, preventing bucket bloat.
- **Automated Email Reports (Edge Functions)**:
  - **Daily Sales Report**: Generates an end-of-day breakdown (Revenue, Top 5 items, Order statuses) sent nightly via Resend.
  - **Weekly Admin Logs**: Compiles all admin actions into a `.csv` and emails them weekly before securely clearing old logs.
  - **Bi-Monthly Order History**: Emails a full `.csv` backup of all store orders every 2 months.
- **Automated Database Backups**: Powered by a GitHub Actions Cron job to securely dump and save the entire PostgreSQL database every night at midnight.
- **CI/CD Deployment**: Fully integrated with GitHub and Vercel for continuous automated deployments.

## Tech Stack

### Frontend Core
- **React 18** & **TypeScript**: For robust, type-safe UI development.
- **Vite**: Ultra-fast frontend build tool and development server.
- **React Router DOM**: Client-side routing.

### Styling & UI
- **Custom Admin UI**: A sleek, custom-built dark-themed design system utilizing structured inline styles for a premium, high-performance management experience.
- **Tailwind CSS**: Utility-first styling used throughout the customer-facing application.
- **shadcn/ui & Radix UI**: Accessible, customizable, and headless UI components.
- **Framer Motion**: Fluid, physics-based animations and transitions.
- **@hello-pangea/dnd**: Robust drag-and-drop interactions for sorting categories.
- **Vaul**: High-performance drawer components for mobile-friendly interactions.
- **Lucide React**: Beautiful and consistent iconography.

### State Management & Forms
- **Zod & React Hook Form**: Type-safe schema validation and form state management.
- **Sonner**: Toast notifications.

### Backend & Database
- **Supabase**: Open-source Firebase alternative providing the backend infrastructure.
  - **PostgreSQL Database**: Relational data storage for menu items, orders, tables, and settings.
  - **Supabase Realtime**: WebSocket-based subscriptions for instant UI updates across all connected clients.
  - **Supabase Storage**: Cloud storage buckets for uploading GCash receipts and menu item images.

## Getting Started

### Prerequisites
- Node.js & npm installed
- A Supabase project set up with the required database schemas and storage buckets.

### Installation

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```sh
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:8080` (or the port Vite provides) to see the app running.
