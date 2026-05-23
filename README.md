# Papicholos Order Management System

A full-stack, real-time restaurant ordering and management system designed for both dine-in and pickup customers. The application features a sleek customer-facing menu and a powerful administrative dashboard, all synced instantly using WebSockets.

## Key Features

### Customer Experience
- **Interactive Menu & Cart**: Browse food items by category, view dynamic prices, and manage quantities in a slide-out cart.
- **Flexible Ordering**: Support for **Dine-In** (scan table QR code or select manually) and **Store Pickup** (auto-generated pickup codes).
- **Payment Integration**: Choose between "Pay at Counter" or "GCash" (includes a receipt image upload feature).
- **Live Order Tracking**: A floating status bar and an animated full-screen stepper track your order in real-time ("Pending" → "Preparing" → "Ready to Serve" → "Completed").
- **Order History**: Track past and active orders directly on the device.

### Admin Dashboard
- **Real-Time Kanban Board**: Live view of incoming orders. Admins can move orders through the preparation pipeline with a single click.
- **Menu Management**: Full CRUD interface to add, edit, or delete menu items and categories. Includes direct cloud image uploads.
- **Table & QR Code Manager**: Manage active tables and automatically generate downloadable QR codes that map directly to the table's ordering link.
- **Order History & Reversal**: View all past orders, filter by status, and securely restore accidentally cancelled orders (password protected).
- **Store Settings**: Dynamically update store-wide settings such as checkout fees.

## Tech Stack

### Frontend Core
- **React 18** & **TypeScript**: For robust, type-safe UI development.
- **Vite**: Ultra-fast frontend build tool and development server.
- **React Router DOM**: Client-side routing.

### Styling & UI
- **Tailwind CSS**: Utility-first styling for rapid UI development.
- **shadcn/ui & Radix UI**: Accessible, customizable, and headless UI components.
- **Framer Motion**: Fluid, physics-based animations and transitions.
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
