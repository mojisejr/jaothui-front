---
applyTo: '**'
---

# System Architecture Documentation
## Jaothui ID-Trace System

### Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Security Architecture](#security-architecture)
6. [Performance Architecture](#performance-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability Design](#scalability-design)
9. [Monitoring & Observability](#monitoring--observability)
10. [Development Workflow](#development-workflow)
11. [Infrastructure Components](#infrastructure-components)

### Architecture Overview

The Jaothui ID-Trace system follows a modern, cloud-native architecture designed for scalability, security, and maintainability. The system is built as a full-stack web application with clear separation between frontend, backend, and data layers.

#### Core Architecture Principles
1. **Mobile-First Design**: Optimized for mobile devices with progressive enhancement
2. **Zero-Trust Security**: Every operation requires authentication and authorization
3. **Microservice-Ready**: Modular design for future microservice migration
4. **API-First Design**: RESTful APIs with comprehensive documentation
5. **Data Privacy First**: Privacy-by-design with proper data isolation

#### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Mobile Web App (React/Next.js)                              │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   Browser UI    │  │   Components    │                     │
│  │   (shadcn-ui)   │  │   (recharts)    │                     │
│  │   (Tailwind)    │  │   (lucide)      │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router)                                     │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   API Routes    │  │   Middleware    │                     │
│  │   (Auth)        │  │   (RLS)          │                     │
│  │   (Validation)  │  │   (Rate Limit)   │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase Services                                           │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   PostgreSQL    │  │   Auth Service  │                     │
│  │   (Prisma ORM)   │  │   (better-auth) │                     │
│  │   (RLS Policies) │  │   (LINE OAuth)   │                     │
│  └─────────────────┘  └─────────────────┘                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   File Storage  │  │   Real-time     │                     │
│  │   (Supabase)    │  │   (Postgres)    │                     │
│  │   (Images)      │  │   (Future)       │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend Stack
```
Framework: Next.js 14.x (Pages Router)
UI Library: Tailwind CSS v3 + DaisyUI
Language: TypeScript
State Management: React Hooks + SWR + React Query
Forms: react-hook-form + zod
Icons: React Icons
Animations: Framer Motion
CMS: Sanity CMS (for blog/content)
Web3: Wagmi + RainbowKit + viem
Testing: Jest + @testing-library/react
```

#### Backend Stack
```
Runtime: Node.js (via Next.js Pages API)
API: Next.js Pages API Routes + tRPC
Backend Framework: tRPC for type-safe APIs
Database: PostgreSQL 15+ (Supabase)
ORM: Prisma
Validation: zod
File Storage: Supabase Storage
Authentication: LINE OAuth + Wallet Authentication
Payment: Stripe + LINE Pay
Blockchain: Viem + Wagmi (EVM chains)
```

#### Infrastructure Stack
```
Platform: Vercel (Next.js optimized)
Database: Supabase (PostgreSQL)
Storage: Supabase Storage
CDN: Vercel Edge Network
DNS: Vercel DNS
Monitoring: Vercel Analytics
Error Tracking: Built-in error reporting
```

### System Components

#### 1. Frontend Application Layer

**Next.js 14 Pages Router Structure**
```
pages/
├── _app.tsx                  # App wrapper, providers setup
├── _document.tsx             # Document wrapper
├── index.tsx                 # Home page
├── partners.tsx              # Partners page
├── unauthorized.tsx          # Unauthorized access page
├── api/                      # API routes (tRPC + REST)
│   ├── trpc/[trpc].ts       # tRPC router endpoint
│   ├── auth/                # Authentication endpoints
│   ├── cart/                # Shopping cart endpoints
│   ├── cert/                # Certificate endpoints
│   ├── jaothui-studio/      # Studio endpoints
│   ├── oauth/               # OAuth callbacks
│   ├── payment/             # Payment processing
│   ├── profile/             # Profile endpoints
│   └── store/               # Store endpoints
├── cart/                     # Shopping cart pages
├── cert/                     # Certificate pages
├── jaothui-studio/          # Studio pages
├── oauth/                   # OAuth callback pages
├── payment/                 # Payment pages
├── profile/                 # User profile pages
└── store/                   # Store pages

components/
├── Arttoy/                  # NFT/Art toy components
├── Buffalo-Summit-2025/     # Voting/summit components
├── Cart/                    # Cart UI components
├── Cert/                    # Certificate components
├── Game/                    # Game-related components
├── Home/                    # Home page components
├── Layouts/                 # Layout wrappers
├── MyFarm/                  # Farm management UI
│   ├── Dashboard.tsx
│   ├── BuffaloManagement.tsx
│   ├── AssetList.tsx
│   ├── FertilizationTable.tsx
│   └── ...
├── Privilege/               # Privilege/reward components
├── Profile/                 # User profile components
├── Reward/                  # Reward system components
├── Shared/                  # Shared/common components
└── Store/                   # Store UI components
```

**Component Architecture**
```typescript
// Actual component hierarchy
components/
├── Arttoy/                  # NFT Art components
│   └── Card/               # Card display components
├── Buffalo-Summit-2025/     # Summit/voting components
│   ├── BuffaloVoteMenuCard.tsx
│   ├── SummitLeaderBoard.tsx
│   └── SummitLogo.tsx
├── Cart/                    # Shopping cart components
│   ├── Buttons/            # Cart action buttons
│   ├── Card/               # Cart item cards
│   └── Layout/             # Cart layout
├── Cert/                    # Certificate components
│   ├── Detail/             # Certificate details
│   ├── PleaseConnect.tsx
│   ├── Profile.tsx
│   └── ProfileMenu.tsx
├── Game/                    # Game components
│   └── GameListCard.tsx
├── Home/                    # Home page components
│   ├── Hero/               # Hero section
│   └── Pedigree/           # Pedigree info
├── Layouts/                 # Layout components
│   ├── index.tsx
│   ├── PrivilegeLayout.tsx
│   └── StoreLayout.tsx
├── MyFarm/                  # Farm management
│   ├── AddAsset.tsx
│   ├── AssetList.tsx
│   ├── BuffaloDetail.tsx
│   ├── BuffaloManagement.tsx
│   ├── CreateFarm.tsx
│   ├── Dashboard.tsx
│   ├── FertilizationTable.tsx
│   ├── MobileTables.tsx
│   └── TabletsTable.tsx
├── Privilege/               # Privilege/reward components
│   ├── Card.tsx
│   ├── Cardv2.tsx
│   ├── HotWheel.tsx
│   ├── MultipleRedeemCard.tsx
│   └── ...
├── Profile/                 # User profile components
│   └── ...
├── Reward/                  # Reward system components
│   └── ...
├── Shared/                  # Common/shared components
│   └── ...
└── Store/                   # Store/marketplace components
    └── ...
```

#### 2. API Layer

**tRPC Backend Structure**
```
server/
├── config.ts              # Server configuration
├── context.ts             # tRPC context setup
├── prisma.ts              # Prisma client configuration
├── trpc.ts                # tRPC setup with middleware
├── viem.ts                # Viem (Ethereum) client config
├── routers/               # tRPC route handlers
│   ├── auth.ts           # Authentication router
│   ├── user.ts           # User management router
│   ├── farm.ts           # Farm operations router
│   ├── pedigree.ts       # Pedigree data router
│   ├── microchip.ts      # Microchip operations router
│   ├── payment.ts        # Payment processing router
│   ├── order.ts          # Order management router
│   └── ...
├── services/              # Business logic services
│   ├── stripe.ts         # Stripe payment service
│   ├── lineapi.ts        # LINE API integration
│   ├── supabase.ts       # Supabase service
│   └── ...
└── supabase/              # Supabase configuration
    └── supabaseclient.ts
```

**tRPC Router Pattern**
```typescript
// server/routers/example.ts
import { publicProcedure, router } from "@/server/trpc"
import { z } from "zod"

export const exampleRouter = router({
  // Public procedure (no auth required)
  getPublicData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),

  // Protected procedure (auth required)
  updateData: publicProcedure
    .input(z.object({ id: z.string(), data: z.any() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized")
      // Implementation
    }),
})
```

**API Route Integration (Pages API)**
```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from "@trpc/server/adapters/next"
import { appRouter } from "@/server/routers/_app"
import { createContext } from "@/server/context"

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? "<no-path>"}:`, error)
        }
      : undefined,
})
```

**REST API Routes (Legacy)**
```typescript
// pages/api/auth/[...auth].ts     - Authentication endpoints
// pages/api/payment/[...].ts      - Payment processing
// pages/api/oauth/callback.ts     - OAuth callbacks
// pages/api/profile/index.ts      - Profile operations
```

#### 3. Database Layer

**Prisma Schema Configuration** (Actual Models)
```prisma
// prisma/schema.prisma

model User {
  id              Int       @id @default(autoincrement())
  avatar          String?
  name            String?
  farmName        String?
  wallet          String    @unique
  address         String
  province        String
  lat             Float?
  lon             Float?
  role            String    @default("USER")
  lineId          String?   @unique
  email           String?
  tel             String?
  active          Boolean   @default(false)
  approved        String[]  @default([])
  approvedCount   Int       @default(0)
  createdAt       DateTime  @default(now())
  updateAt        DateTime  @updatedAt
  
  Certificate           Certificate[]
  CertificateApprover  CertificateApprover?
  Farm                 Farm[]
  MicrochipOrder       MicrochipOrder[]
  payment              Payment[]
}

model Farm {
  id              Int           @id @default(autoincrement())
  name            String
  lat             Float
  lon             Float
  imageUrl        String?       @default("/images/thuiLogo.png")
  description     String?
  tel             String?
  websiteUrl      String?
  facebook        String?
  twitter         String?
  locationUrl     String?
  userId          Int?
  user            User?         @relation(fields: [userId], references: [id])
  MicrochipOrder  MicrochipOrder[]
}

model Payment {
  id              Int       @id @default(autoincrement())
  wallet          String
  isLifeTime      Boolean   @default(false)
  active          Boolean   @default(true)
  start           DateTime  @default(now())
  end             DateTime?
  slipUrl         String
  approver        String[]  @default([])
  approvedCount   Int       @default(0)
  rejector        String[]  @default([])
  rejectedCount   Int       @default(0)
  userId          Int?
  currentStep     Int       @default(0)
  User            User?     @relation(fields: [userId], references: [id])
}

model Pedigree {
  microchip       String    @id @unique
  name            String
  certNo          String?
  birthday        DateTime
  sex             String
  motherId        String?
  fatherId        String?
  origin          String?   @default("thai")
  height          Int?      @default(0)
  color           String
  createdAt       String
  detail          String
  dna             String
  image           String?
  rarity          String    @default("Normal")
  tokenId         BigInt
  updatedAt       String
  Reward          Reward[]
}

// Additional models: Microchip, MicrochipOrder, Reward, Certificate, etc.
```

**Database Features**
- Integer-based primary keys (not UUID)
- Wallet-based user identification for blockchain integration
- GIS support (lat/lon for location services)
- Array fields for multi-value attributes (approved[], rejector[])
- Blockchain integration (tokenId, wallet addresses)

### Data Flow Architecture

#### 1. Authentication Flow
```
User Request → Frontend → LINE OAuth/Username → API → better-auth →
JWT Token → Frontend → Secure Cookie → Auth Middleware → Protected Route
```

**Authentication Flow Details**
```mermaid
sequenceDiagram
    participant User as U
    participant Frontend as F
    participant API as A
    participant LINE as L
    participant DB as D

    U->>F: Click "Login with LINE"
    F->>L: OAuth Redirect
    L->>F: Authorization Code
    F->>A: POST /auth/line/login
    A->>L: Exchange Code for Token
    L->>A: Access Token + User Info
    A->>D: Find/Create User
    A->>A: Create JWT Session
    A->>F: Session Token + User Data
    F->>U: Redirect to Profile
```

#### 2. Data Access Flow
```
User Action → Frontend Component → API Request →
Auth Middleware → Permission Check → Database Query →
RLS Policy Enforcement → Response → Frontend Update
```

**Data Access Pattern**
```typescript
// Secure data access pattern
export async function getAnimal(animalId: string, request: Request) {
  // 1. Authentication (handled by middleware)
  const session = await auth()

  // 2. Authorization
  const animal = await db.animal.findUnique({ where: { id: animalId } })
  if (!animal) throw new Error("Animal not found")

  await requireFarmMembership(request, animal.farmId)

  // 3. Data Query (RLS automatically filters by farm membership)
  return db.animal.findUnique({
    where: { id: animalId },
    include: { activities: true }
  })
}
```

#### 3. File Upload Flow
```
User Selection → Frontend File Input →
Client Validation → Upload to Supabase Storage →
Database Update with Image URL → Frontend Display Update
```

**File Upload Implementation**
```typescript
// Upload animal image
export async function uploadAnimalImage(animalId: string, file: File) {
  // 1. Validate permissions
  const animal = await db.animal.findUnique({ where: { id: animalId } })
  await requireFarmMembership(request, animal.farmId)

  // 2. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${animalId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('animal-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // 3. Update animal record
  const imageUrl = data.publicUrl
  await db.animal.update({
    where: { id: animalId },
    data: { imageUrl }
  })

  return imageUrl
}
```

### Security Architecture

#### 1. Authentication Security

**better-auth Configuration**
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { LINE } from "better-auth/providers/line"

export const { auth, signIn, signOut } = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  providers: [
    {
      id: "line",
      name: "LINE",
      type: "oidc",
      issuer: "https://access.line.me",
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      wellKnown: "https://access.line.me/.well-known/openid_configuration",
    },
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Custom sign-in logic
      return true
    },
    async session({ session, user }) {
      // Customize session data
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role,
        },
      }
    },
  },
})
```

#### 2. Authorization Security

**Row Level Security (RLS)**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;

-- Policy for animal table
CREATE POLICY "farm_members_can_manage_animals" ON animals
    FOR ALL
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );
```

#### 3. Input Validation Security

**Zod Validation Schemas**
```typescript
// lib/validations.ts
import { z } from 'zod'

export const animalSchema = z.object({
  farmId: z.string().uuid(),
  tagId: z.string().min(1).max(50),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['WATER_BUFFALO', 'SWAMP_BUFFALO', 'CATTLE', 'GOAT', 'PIG', 'CHICKEN']),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('FEMALE'),
  status: z.enum(['ACTIVE', 'TRANSFERRED', 'DECEASED', 'SOLD']).default('ACTIVE'),
  birthDate: z.string().datetime().optional(),
  color: z.string().max(255).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  motherTag: z.string().max(50).optional(),
  fatherTag: z.string().max(50).optional(),
  genome: z.string().optional(),
})

export const activitySchema = z.object({
  farmId: z.string().uuid(),
  animalId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  activityDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE']).default('PENDING'),
})
```

#### 4. API Security

**Rate Limiting Implementation**
```typescript
// lib/rate-limit.ts
import { RateLimit } from "unlimited-api"

// Different limits for different endpoints
const authLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return authLimiter(request)
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return apiLimiter(request)
  }
}
```

### Performance Architecture

#### 1. Frontend Performance

**Code Splitting Strategy**
```typescript
// Dynamic imports for route-based code splitting
import dynamic from 'next/dynamic'

const AnimalDetail = dynamic(() => import('@/components/features/animals/animal-detail'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
})

// Lazy loading for heavy components
const ActivityTimeline = lazy(() => import('@/components/features/activities/activity-timeline'))
```

**Optimization Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    domains: ['supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

#### 2. Database Performance

**Query Optimization**
```typescript
// Efficient querying with selective fields
export async function getAnimalsList(farmId: string, options: {
  page: number
  limit: number
  search?: string
}) {
  return db.animal.findMany({
    where: {
      farmId,
      ...(options.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { tagId: { contains: options.search, mode: 'insensitive' } }
        ]
      }
    },
    select: {
      id: true,
      tagId: true,
      name: true,
      type: true,
      status: true,
      imageUrl: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip: (options.page - 1) * options.limit,
    take: options.limit
  })
}
```

**Connection Pooling**
```typescript
// Database connection with pooling
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pool settings
  // Prisma handles connection pooling automatically in production
})
```

#### 3. Caching Strategy

**React Query for Data Caching**
```typescript
// lib/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useAnimals(farmId: string, options: {
  page?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['animals', farmId, options],
    queryFn: () => getAnimalsPaginated(farmId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateAnimal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      // Invalidate and refetch animals list
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
  })
}
```

### Deployment Architecture

#### 1. Vercel Deployment

**Build Configuration**
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"
  }
}
```

**Environment Variables**
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/jaothui_db
LINE_CLIENT_ID=your-line-client-id
LINE_CLIENT_SECRET=your-line-client-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### 2. Vercel Deployment

**Build Configuration**
```json
// package.json scripts (actual)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

**Environment Variables** (Production)
```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Authentication
LINE_CLIENT_ID=your-line-client-id
LINE_CLIENT_SECRET=your-line-client-secret

# Payment
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Blockchain
VIEM_RPC_URL=https://rpc.example.com
WALLET_PRIVATE_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# External APIs
BITKUB_API_KEY=...
BITKUB_SECRET_KEY=...
```

#### 3. Infrastructure Integration

**Supabase Setup**
```typescript
// server/supabase/supabaseclient.ts
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Stripe Integration**
```typescript
// server/services/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

**Viem/Wagmi Blockchain Integration**
```typescript
// server/viem.ts
import { createClient, http } from "viem"
import { mainnet, polygon } from "viem/chains"

export const viemClient = createClient({
  chain: mainnet,
  transport: http(process.env.VIEM_RPC_URL),
})
```

**LINE API Integration**
```typescript
// server/services/lineapi.ts
import axios from "axios"

const lineClient = axios.create({
  baseURL: "https://api.line.me",
  headers: {
    "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
  },
})

export async function getLINEUserProfile(userId: string) {
  const response = await lineClient.get(`/v2/bot/profile/${userId}`)
  return response.data
}
```

### Monitoring & Observability

#### 1. Application Monitoring

**Error Tracking**
```typescript
// lib/error-tracking.ts
export function captureError(error: Error, context?: any) {
  console.error('Application Error:', error, context)

  // Send to error tracking service (Vercel Analytics or external)
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
}
```

**Performance Monitoring**
```typescript
// lib/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    console.log(`${name} took ${duration.toFixed(2)}ms`)

    // Send to monitoring service
    if (duration > 1000) { // Alert on slow operations
      captureError(new Error(`Slow operation: ${name}`), { duration })
    }
  }
}
```

#### 2. Database Monitoring

**Query Performance Tracking**
```typescript
// lib/db-monitoring.ts
const originalQuery = db.animal.findMany

db.animal.findMany = function(...args) {
  const start = Date.now()
  return originalQuery.apply(this, args).then(result => {
    const duration = Date.now() - start

    // Log slow queries
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        duration,
        query: args[0],
        resultCount: result.length
      })
    }

    return result
  })
}
```

### Development Workflow

#### 1. Local Development

**Development Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start database
docker-compose up -d postgres

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

**Testing Strategy**
```typescript
// Component testing
import { render, screen } from '@testing-library/react'
import { AnimalCard } from '@/components/features/animals/animal-card'

test('displays animal information', () => {
  const animal = {
    id: '1',
    tagId: '001',
    name: 'นาเดีย',
    type: 'WATER_BUFFALO',
    status: 'ACTIVE'
  }

  render(<AnimalCard animal={animal} />)

  expect(screen.getByText('นาเดีย')).toBeInTheDocument()
  expect(screen.getByText('001')).toBeInTheDocument()
})

// API testing
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/animals/[id]/route'

test('returns animal data', async () => {
  const mocks = createMocks()

  const request = new Request('http://localhost:3000/api/animals/1')
  const response = await GET(request, { params: { id: '1' } })

  expect(response.status).toBe(200)
  expect(response.data.success).toBe(true)
})
```

#### 2. CI/CD Pipeline

**GitHub Actions Workflow**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

**Document Version**: 1.0
**Last Updated**: November 12, 2025