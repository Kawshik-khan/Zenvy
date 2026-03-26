# 🎓 Zenvy: Smart Peer-to-Peer Study Platform

**Zenvy** is a high-performance, real-time study platform designed to connect students through collaborative tools, AI-driven partner matching, and seamless communication.

## 🚀 Key Features

### 📡 Real-Time Communication
- **Voice & Video Calling:** Peer-to-peer calling using WebRTC (`simple-peer`) and Socket.io signaling.
- **Smart Hardware Release:** Automatic release of camera and microphone tracks after every call for maximum privacy.
- **Global Study Lounge:** A real-time lobby for all active students.
- **Private DMs:** Secure, direct messaging with persistence and real-time updates.

### 🧠 Intelligent Partner Matching
- **Compatibility Scoring:** Automatic synergy calculation based on majors, interests, and academic overlap.
- **Partner Discovery:** Easily find and connect with peers whose study habits align with yours.

### 📊 Dynamic Dashboard & Profiles
- **Live Stats:** Real-time visibility into active study groups and upcoming sessions.
- **Rich Profiles:** Personalized student profiles with major, college, and bio details.
- **Cloud Storage:** Secure profile picture uploads integrated with Supabase Storage.

### ✨ Visual Excellence
- **Fluid Animations:** Butter-smooth page transitions and staggered entrance animations.
- **Premium UI:** A high-end, responsive design with glassmorphism and modern typography.
- **Elite Loading States:** Custom-designed loading screens for a seamless UX.

## 🛠️ Tech Stack

- **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router), React, Tailwind CSS.
- **Backend:** Node.js (Vercel Runtime), [Prisma ORM](https://www.prisma.io/).
- **Database:** PostgreSQL (with PgBouncer support).
- **Authentication:** [Auth.js v5](https://authjs.dev/) (NextAuth).
- **Real-Time:** [Socket.io](https://socket.io/) & WebRTC.
- **Storage:** [Supabase Storage](https://supabase.com/storage).
- **Email:** [Resend](https://resend.com/).

## ⚙️ Setup & Installation

### 1. Requirements
- Node.js 18+
- PostgreSQL Database
- Supabase Account
- Resend API Key

### 2. Environment Variables
Create a `.env` file in the root directory and add the following:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/dbname"

# Auth
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (Storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Resend (Email)
RESEND_API_KEY="re_..."
```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

## 📂 Project Structure
- `/app`: Next.js 15 app router pages and components.
- `/prisma`: Database schema and migrations.
- `/lib`: Shared utilities (Prima, Socket.io, Supabase client).
- `/public`: Static assets (fonts, images).

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
