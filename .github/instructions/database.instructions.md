````instructions
---
applyTo: '**'
---
# Database Schema Documentation
## Jaothui System - Blockchain & Web3 NFT Integration

### Table of Contents
1. [Overview](#overview)
2. [Database Technology](#database-technology)
3. [Schema Design Principles](#schema-design-principles)
4. [Core Data Models](#core-data-models)
5. [Blockchain Integration](#blockchain-integration)
6. [Prisma Setup](#prisma-setup)
7. [Query Patterns](#query-patterns)
8. [Performance Optimization](#performance-optimization)

### Overview

The Jaothui database schema supports:
- User management with wallet-based authentication
- Farm ownership and NFT management
- Pedigree tracking with blockchain tokenization
- Payment processing with multiple payment methods
- Microchip inventory management
- Reward/privilege system

### Database Technology

#### Stack Components
- **Database**: PostgreSQL 15+ (via Supabase)
- **ORM**: Prisma v5.14+ with TypeScript
- **Migration**: Prisma Migrate
- **Authentication**: Wallet + LINE OAuth hybrid
- **File Storage**: Supabase Storage
- **Blockchain**: Ethereum/EVM chain integration with viem

#### Connection Details
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Schema Design Principles

1. **Wallet-First Authentication**: Primary identification via blockchain wallets
2. **NFT Integration**: Blockchain token IDs for digital assets
3. **Audit Trail**: Creation and update timestamps on all records
4. **Flexible Status**: String-based status fields for permission management
5. **Array Support**: PostgreSQL array type for lists of approvers/rejectors
6. **Integer PKs**: Integer IDs for better performance than UUIDs
7. **GIS Support**: Latitude/longitude for location-based queries

### Core Data Models

#### User Model
```prisma
model User {
  id              Int       @id @default(autoincrement())
  
  // Identity
  avatar          String?
  name            String?
  farmName        String?
  email           String?
  tel             String?
  
  // Blockchain
  wallet          String    @unique           // Primary identifier
  address         String                      // Public address
  
  // Location
  province        String
  lat             Float?
  lon             Float?
  
  // Status
  role            String    @default("USER")  // USER, ADMIN, etc.
  active          Boolean   @default(false)
  lineId          String?   @unique          // LINE OAuth integration
  
  // Approvals
  approved        String[]  @default([])     // Array of approver addresses
  approvedCount   Int       @default(0)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updateAt        DateTime  @updatedAt
  
  // Relations
  Certificate           Certificate[]
  CertificateApprover   CertificateApprover?
  Farm                  Farm[]
  MicrochipOrder        MicrochipOrder[]
  payment               Payment[]
  
  @@index([wallet])
  @@index([lineId])
}
```

**Key Features**:
- Wallet as unique identifier for Web3 integration
- Ethereum address storage for smart contracts
- LINE OAuth fallback for social login
- Approval workflow with address arrays
- Farm ownership tracking

#### Farm Model
```prisma
model Farm {
  id              Int             @id @default(autoincrement())
  name            String
  
  // Location
  lat             Float
  lon             Float
  
  // Metadata
  imageUrl        String?         @default("/images/thuiLogo.png")
  description     String?
  tel             String?
  websiteUrl      String?
  facebook        String?
  twitter         String?
  locationUrl     String?
  
  // Owner
  userId          Int?
  user            User?           @relation(fields: [userId], references: [id])
  
  // Relations
  MicrochipOrder  MicrochipOrder[]
  
  @@index([userId])
}
```

**Key Features**:
- Geographic coordinates for map integration
- Social media links
- Owner-based access control
- Microchip order tracking

#### Pedigree Model (NFT Asset)
```prisma
model Pedigree {
  microchip       String    @id @unique      // Unique identifier
  name            String
  certNo          String?                     // Certificate number
  
  // Biological data
  birthday        DateTime
  sex             String
  motherId        String?
  fatherId        String?
  origin          String?   @default("thai")
  height          Int?      @default(0)
  color           String
  
  // Genetics
  dna             String                      // DNA/genetic data
  detail          String                      // Additional details
  
  // NFT Data
  tokenId         BigInt                      // Blockchain token ID
  image           String?                     // IPFS or CDN image URL
  rarity          String    @default("Normal") // Rarity classification
  
  // Timestamps
  createdAt       String                      // ISO string
  updatedAt       String                      // ISO string
  
  // Relations
  Reward          Reward[]
  
  @@index([tokenId])
}
```

**Key Features**:
- NFT tokenization with BigInt token ID
- Genetic/pedigree data
- Rarity system for NFT valuation
- Blockchain integration

#### Payment Model
```prisma
model Payment {
  id              Int       @id @default(autoincrement())
  
  // Identification
  wallet          String                      // User wallet address
  
  // Status
  isLifeTime      Boolean   @default(false)   // Lifetime membership
  active          Boolean   @default(true)
  
  // Timeline
  start           DateTime  @default(now())
  end             DateTime?
  slipUrl         String                      // Payment proof URL
  
  // Approval workflow
  approver        String[]  @default([])      // Approver addresses
  approvedCount   Int       @default(0)
  rejector        String[]  @default([])      // Rejector addresses
  rejectedCount   Int       @default(0)
  currentStep     Int       @default(0)       // Workflow step
  
  // User relation
  userId          Int?
  User            User?     @relation(fields: [userId], references: [id])
  
  @@index([wallet])
  @@index([userId])
}
```

**Key Features**:
- Multi-step approval workflow
- Address-based approval tracking
- Lifetime membership support
- Payment proof tracking

#### Microchip Model
```prisma
model Microchip {
  id              Int             @id @default(autoincrement())
  microchip       String          @unique
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations to orders
  MicrochipOrder  MicrochipOrder[]
  
  @@index([microchip])
}

model MicrochipOrder {
  id              Int         @id @default(autoincrement())
  
  // Relations
  microchipId     Int
  microchip       Microchip   @relation(fields: [microchipId], references: [id])
  
  farmId          Int
  farm            Farm        @relation(fields: [farmId], references: [id])
  
  userId          Int
  user            User        @relation(fields: [userId], references: [id])
  
  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([microchipId, farmId])
  @@index([farmId])
  @@index([userId])
}
```

**Key Features**:
- Inventory tracking
- Farm-user-microchip relationships
- Unique constraints for ordering

#### Additional Models
- **Certificate**: NFT-like certificate management
- **Reward**: Incentive/privilege tracking linked to Pedigree
- **Advertisement**: Marketing content management

### Blockchain Integration

#### Token Management
```prisma
// In Pedigree model
tokenId         BigInt      // Ethereum token ID (ERC-721/1155)
```

#### Smart Contract Interaction
```typescript
// server/viem.ts
import { createClient, http } from "viem"
import { mainnet } from "viem/chains"

export const viemClient = createClient({
  chain: mainnet,
  transport: http(process.env.VIEM_RPC_URL),
})

// Interact with NFT contracts
export async function getNFTMetadata(contractAddress: string, tokenId: BigInt) {
  // Call smart contract functions
}
```

#### Wallet Authentication
```typescript
// Users authenticate via MetaMask or wallet connect
// User.wallet becomes the primary identifier
// User.address stores public address for contract calls
```

### Prisma Setup

#### Installation
```bash
npm install @prisma/client
npm install -D prisma
```

#### Database Client Configuration
```typescript
// server/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
```

#### Migrations
```bash
# Generate migration
npx prisma migrate dev --name initial_schema

# Apply migration
npx prisma migrate deploy

# Check database state
npx prisma db push

# Studio (GUI)
npx prisma studio
```

### Query Patterns

#### Finding Users by Wallet
```typescript
// Primary lookup pattern
const user = await prisma.user.findUnique({
  where: { wallet: userAddress },
  include: {
    Farm: true,
    payment: true,
  },
})
```

#### Farm with Pedigrees
```typescript
const farm = await prisma.farm.findUnique({
  where: { id: farmId },
  include: {
    MicrochipOrder: {
      include: {
        microchip: true,
      },
    },
    user: true,
  },
})
```

#### Payment Approval Workflow
```typescript
// Multi-step approval
const payment = await prisma.payment.update({
  where: { id: paymentId },
  data: {
    approver: {
      push: approverAddress,
    },
    approvedCount: {
      increment: 1,
    },
    currentStep: paymentStep,
  },
})
```

#### Blockchain Token Lookup
```typescript
const pedigree = await prisma.pedigree.findUnique({
  where: { tokenId: BigInt(tokenId) },
  include: {
    Reward: true,
  },
})
```

### Performance Optimization

#### Indexing Strategy
```prisma
// User lookups
@@index([wallet])
@@index([lineId])

// Payment tracking
@@index([wallet])
@@index([userId])

// Farm relationships
@@index([userId])

// Microchip orders
@@index([farmId])
@@index([userId])
```

#### Query Optimization
```typescript
// Only select needed fields
const user = await prisma.user.findUnique({
  where: { wallet: address },
  select: {
    id: true,
    wallet: true,
    name: true,
    active: true,
  },
})

// Use pagination for large results
const payments = await prisma.payment.findMany({
  where: { userId: userId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: "desc" },
})
```

#### Connection Pooling
- Automatically handled by Supabase
- Connection pool size: 10-20 connections
- Idle timeout: 30 seconds

### Data Security

#### No RLS (Row Level Security)
- Current setup relies on application-level authorization
- All permission checks happen in tRPC routers/API handlers
- User context passed through tRPC procedures

#### Application-Level Authorization
```typescript
// Verify user owns resource
async function verifyOwnership(userId: number, resourceId: number) {
  const resource = await prisma.farm.findFirst({
    where: {
      id: resourceId,
      userId: userId,
    },
  })
  
  if (!resource) throw new Error("Unauthorized")
  return resource
}
```

#### Wallet-Based Authorization
```typescript
// Verify wallet matches
function verifyWallet(requestWallet: string, dbWallet: string) {
  if (requestWallet.toLowerCase() !== dbWallet.toLowerCase()) {
    throw new Error("Wallet mismatch")
  }
}
```

---

**Document Version**: 2.0
**Last Updated**: November 16, 2025
**Alignment**: Actual Prisma schema and Web3 integration
````
