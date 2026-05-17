# 🎯 AtomQuest Portal

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11.x-2596be)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748)](https://prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC)](https://tailwindcss.com/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E)](https://railway.app/)

**Enterprise Goal Setting & Tracking Portal** for AtomQuest Hackathon 1.0

## 🌐 Live Demo

**https://atomquest-portal.up.railway.app**

> No login required! Use the role switcher in the top navbar.

---

## 📋 Features

### Phase 1: Goal Creation & Approval
- ✅ Create goals with Thrust Area, Title, Description
- ✅ 4 UoM types: Numeric, Percentage, Timeline, Zero-based
- ✅ **Validation rules:** Total weightage = 100%, Min 10% per goal, Max 8 goals
- ✅ Manager approval workflow (approve, return for rework)
- ✅ Inline edit of targets/weightage during approval
- ✅ Goals lock after approval

### Phase 2: Achievement Tracking
- ✅ Quarterly check-in interface (Q1-Q4)
- ✅ Status: Not Started / On Track / Completed
- ✅ System-computed progress scores per UoM type
- ✅ **Quarterly time locks:** Q1=July, Q2=October, Q3=January, Q4=March/April
- ✅ Manager comments and feedback

### Shared Goals (BRD 1.10-1.12)
- ✅ Admin pushes departmental KPIs to multiple employees
- ✅ Recipients adjust weightage only (Title/Target read-only)
- ✅ Cascading achievement updates to all linked goals

### Reporting & Governance
- ✅ CSV/Excel export of achievement reports
- ✅ Real-time completion dashboard
- ✅ Audit trail with timestamps

### 3 User Roles
| Role | Capabilities |
|------|-------------|
| 👤 **Employee** | Create goals, submit check-ins, view locked goals |
| 👔 **Manager** | Approve goals, edit inline, add comments |
| ⚙️ **Admin** | Push KPIs, unlock goals, export reports, audit logs |

### Bonus Features
- ✅ **Microsoft Entra ID (Azure AD)** - SSO ready
- ✅ **Analytics Module** - QoQ trends, goal distribution, manager leaderboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| API | tRPC |
| Database | SQLite + Prisma ORM |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | NextAuth.js (Azure AD) |
| Hosting | Railway |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/anshuman-git01/atomquest-portal.git
cd atomquest-portal

# Install dependencies
npm install

# Set up database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
