````instructions
---
applyTo: '**'
---

# API Documentation
## Jaothui System - tRPC + REST API

### Table of Contents
1. [Overview](#overview)
2. [API Architecture](#api-architecture)
3. [Authentication](#authentication)
4. [tRPC Router Pattern](#trpc-router-pattern)
5. [Available Routers](#available-routers)
6. [Payment Integration](#payment-integration)
7. [Blockchain Integration](#blockchain-integration)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

### Overview

The Jaothui system uses **tRPC** for type-safe API communication between Next.js frontend and backend. tRPC provides:
- Full TypeScript support end-to-end
- Automatic type inference on client
- Real-time type checking
- Built-in validation with Zod

**Base URL (tRPC)**:
```
Development: http://localhost:3000/api/trpc/
Production: https://jaothui.vercel.app/api/trpc/
```

### API Architecture

#### Next.js Pages API + tRPC
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

#### tRPC Setup
```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server"
import { Context } from "./context"

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
```

#### Context Setup
```typescript
// server/context.ts
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { getSession } from "next-auth/react"

export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get user session from wallet/LINE auth
  const user = await getCurrentUser(opts)

  return {
    user,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

### Authentication

#### Hybrid Authentication
1. **Wallet Authentication** (Primary):
   - MetaMask/WalletConnect
   - Signature verification
   - User.wallet as unique identifier

2. **LINE OAuth** (Fallback):
   - LINE LIFF integration
   - Social login alternative

#### Authorization Pattern
```typescript
// All protected routes enforce user context
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
```

### tRPC Router Pattern

#### Basic Router Structure
```typescript
// server/routers/user.ts
import { publicProcedure, protectedProcedure, router } from "@/server/trpc"
import { z } from "zod"

export const userRouter = router({
  // Public: Get user by wallet
  getByWallet: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.user.findUnique({
        where: { wallet: input.wallet },
      })
    }),

  // Protected: Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        farmName: z.string().optional(),
        province: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      })
    }),

  // Protected: Create farm
  createFarm: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        lat: z.number(),
        lon: z.number(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.farm.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      })
    }),
})
```

### Available Routers

#### 1. User Router (`server/routers/user.ts`)
```typescript
export const userRouter = {
  // Queries
  getByWallet(wallet: string)
  getProfile() // Protected
  
  // Mutations
  updateProfile(data) // Protected
  setLineId(lineId: string) // Protected
}
```

#### 2. Farm Router (`server/routers/farm.ts`)
```typescript
export const farmRouter = {
  // Queries
  getAll() // Protected
  getById(id: number) // Protected
  
  // Mutations
  create(data) // Protected
  update(id: number, data) // Protected
}
```

#### 3. Pedigree Router (`server/routers/pedigree.ts`)
```typescript
export const pedigreeRouter = {
  // Queries
  getByMicrochip(microchip: string)
  getByTokenId(tokenId: BigInt)
  getRewards(microchip: string)
  
  // Mutations
  mint(data) // Admin protected
}
```

#### 4. Payment Router (`server/routers/payment.ts`)
```typescript
export const paymentRouter = {
  // Queries
  getPayments(userId: number) // Protected
  getStatus(paymentId: number)
  
  // Mutations
  createPayment(data) // Protected
  approvePayment(id: number) // Admin
  rejectPayment(id: number) // Admin
}
```

#### 5. Auth Router (`server/routers/auth.ts`)
```typescript
export const authRouter = {
  // Mutations
  connectWallet(signature: string, message: string)
  verifyMessage(wallet: string)
}
```

### Payment Integration

#### Stripe Setup
```typescript
// server/services/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Create payment intent
export async function createPaymentIntent(amount: number, wallet: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: "usd",
    metadata: { wallet },
  })
  return paymentIntent
}
```

#### Payment Procedure
```typescript
// server/routers/payment.ts
export const paymentRouter = router({
  createPaymentIntent: publicProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100),
        currency: "usd",
        metadata: {
          wallet: ctx.user?.wallet || "anonymous",
        },
      })

      // Save to database
      await ctx.prisma.payment.create({
        data: {
          wallet: ctx.user?.wallet || "",
          slipUrl: intent.id,
          userId: ctx.user?.id,
        },
      })

      return { clientSecret: intent.client_secret }
    }),
})
```

### Blockchain Integration

#### Viem Setup
```typescript
// server/viem.ts
import { createClient, http } from "viem"
import { mainnet } from "viem/chains"

export const viemClient = createClient({
  chain: mainnet,
  transport: http(process.env.VIEM_RPC_URL),
})
```

#### NFT Interaction
```typescript
// server/routers/nft.ts
export const nftRouter = router({
  // Get NFT metadata
  getNFTMetadata: publicProcedure
    .input(z.object({ tokenId: z.bigint() }))
    .query(async ({ input }) => {
      const pedigree = await prisma.pedigree.findUnique({
        where: { tokenId: input.tokenId },
      })
      return pedigree
    }),

  // Mint NFT (protected)
  mintNFT: protectedProcedure
    .input(
      z.object({
        microchip: z.string(),
        metadataURI: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Call smart contract via viem
      // Save token ID to pedigree record
    }),
})
```

### Frontend Usage with tRPC

#### Client Setup
```typescript
// utils/trpc.ts
import { httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/routers/_app"
import { createTRPCNext } from "@trpc/next"

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
        }),
      ],
    }
  },
})
```

#### Using tRPC in React
```typescript
// pages/profile.tsx
import { trpc } from "@/utils/trpc"

export function ProfilePage() {
  // Query user data
  const { data: user, isLoading } = trpc.user.getProfile.useQuery()

  // Mutation to update profile
  const { mutate: updateProfile } = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      // Refetch user data
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => updateProfile({ name: "New Name" })}>
        Update Profile
      </button>
    </div>
  )
}
```

### Error Handling

#### tRPC Error Codes
```typescript
// Standard error codes
type TRPCErrorCode =
  | "PARSE_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "METHOD_NOT_SUPPORTED"
  | "UNPROCESSABLE_CONTENT"
  | "RATE_LIMIT"
  | "INTERNAL_SERVER_ERROR"

// Usage in procedures
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "You must be logged in to perform this action",
})
```

#### Error Handling Pattern
```typescript
// In components
const mutation = trpc.user.updateProfile.useMutation({
  onError: (error) => {
    if (error.code === "UNAUTHORIZED") {
      redirectToLogin()
    } else if (error.code === "BAD_REQUEST") {
      showValidationError(error.message)
    }
  },
})
```

### Examples

#### Complete Flow: Create Farm
```typescript
// 1. Server router
// server/routers/farm.ts
export const farmRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        lat: z.number(),
        lon: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.farm.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      })
    }),
})

// 2. Client usage
// pages/farms/create.tsx
import { trpc } from "@/utils/trpc"

export function CreateFarmPage() {
  const { mutate: createFarm, isPending } = trpc.farm.create.useMutation({
    onSuccess: (farm) => {
      router.push(`/farms/${farm.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        createFarm({
          name: formData.get("name") as string,
          lat: parseFloat(formData.get("lat") as string),
          lon: parseFloat(formData.get("lon") as string),
        })
      }}
    >
      <input name="name" required />
      <input name="lat" type="number" required />
      <input name="lon" type="number" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Farm"}
      </button>
    </form>
  )
}
```

#### Complete Flow: Wallet Authentication
```typescript
// 1. Server auth router
// server/routers/auth.ts
export const authRouter = router({
  signMessage: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      const message = `Sign this message to verify ownership of ${input.wallet}`
      return { message }
    }),

  verifySignature: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        signature: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify signature
      const isValid = await verifyEthereumSignature(
        input.wallet,
        input.message,
        input.signature
      )

      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
      }

      // Get or create user
      let user = await ctx.prisma.user.findUnique({
        where: { wallet: input.wallet },
      })

      if (!user) {
        user = await ctx.prisma.user.create({
          data: {
            wallet: input.wallet,
            address: input.wallet,
            province: "",
            active: true,
          },
        })
      }

      // Set auth cookie/session
      return { user, token: generateJWT(user) }
    }),
})

// 2. Client authentication
// hooks/useWalletAuth.ts
export function useWalletAuth() {
  const { data: signer } = useEthersSigner()
  const { mutate: verify } = trpc.auth.verifySignature.useMutation()

  const login = async (wallet: string) => {
    // Get message to sign
    const { message } = await trpc.auth.signMessage.fetch({ wallet })

    // Sign message
    const signature = await signer?.signMessage(message)

    // Verify signature
    verify({
      wallet,
      message,
      signature: signature!,
    })
  }

  return { login }
}
```

---

**Document Version**: 2.0
**Last Updated**: November 16, 2025
**API Type**: tRPC (type-safe)
````
