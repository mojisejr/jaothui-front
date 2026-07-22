# 🗺️ Jaothui Frontend - Project Map

**Project**: `jaothui-frontend`
**Type**: Official Web Portal for JAOTHUI NFT (Certificate & Pedigree System)
**Stack**: Next.js (Pages Router), tRPC, Prisma (PostgreSQL), TailwindCSS, Viem (Web3), Sanity (CMS), Supabase

## 1. 🧠 Philosophy
The digital home and verification hub for JAOTHUI NFT. It serves as the bridge between **Physical Buffaloes** (Microchip/DNA/Pedigree) and their **Digital Identities** (NFT/Certificates). 
- **Database-First, Blockchain-Backed**: The system has recently migrated to treat the PostgreSQL Database (`Pedigree` table) as the Primary Source of Truth to improve performance and stability, while the Blockchain remains the Secondary Source for verifying ownership, voting, and token existence.

## 2. 🏛️ Key Landmarks (Navigation)
- 📍 `pages/`: ระบบ Routing หลัก (Next.js Pages)
  - `/cert/` - หน้าข้อมูลใบพันธุ์ประวัติ (Pedigree/Certificate detail)
  - `/privacy`, `/support` - public unauthenticated policy/support routes used by JAOTHUI Mobile App Store submission
  - `/profile/`, `/store/`, `/jaothui-studio/` - เส้นทางหลักอื่นๆ ของ Platform
- 🎨 `components/`: หัวใจของ UI (เป้าหมายหลักสำหรับ **Redesign UI**)
  - มีการแบ่งแยกย่อยตาม Feature: `Cert`, `Profile`, `Store`, `Home`, `Shared` ฯลฯ
- ⚙️ `server/`: Backend Logic (tRPC)
  - `server/routers/` - จุดรับ Request จาก Frontend
  - `server/services/` - Business Logic หลัก (เช่น `metadata.service.ts` ที่คอยจัดการ Data Flow ระหว่าง Database/Blockchain)
- 🗄️ `prisma/`: กำหนด Schema หลัก (`Pedigree`, `Certificate`)
- 📚 `docs/`: แหล่งรวม Architecture & Migration Plan (เช่น `MIGRATION_DATABASE_FIRST_PLAN.md`)

## 3. 🌊 Data Flow (Pedigree & Certificate)
1. **Frontend Request**: UI (เช่น หน้า Certificate) เรียกขอข้อมูลคนหรือควายผ่าน tRPC (`trpc.metadata.getByMicrochip.useQuery`).
2. **tRPC Router**: สั่งงานไปยัง `metadata.service.ts`
3. **Primary Fetch (PostgreSQL)**: ดึงข้อมูลหลักจาก Prisma (ตาราง `Pedigree`) เช่น Name, Detail, Birthdate, Height
4. **Secondary Fetch (Blockchain)**: คุยกับ Smart Contract ผ่าน `viem` เพื่อดึง `tokenId` และเช็คสถานะการ Approved / Ownership 
5. **Merge & Response**: รวมข้อมูลทั้งหมด ส่งกลับไป Render คืนที่ UI

## 4. 🐉 Challenges & Dragons (สิ่งที่ต้องระวัง)
- **Data Divergence (ข้อมูลไม่ตรงกัน)**: รอยต่อระหว่าง Blockchain และ Database อาจจะมีจังหวะที่ข้อมูลหนึ่ง Update ก่อน ส่งผลให้ต้องทำ Fallback/Mapping ทิ้งไว้ (เช่น กรณี `certNft.name.includes` ที่เคยพังเพราะข้อมูลมารูปแบบต่างกัน)
- **Timezone Complexity**: ต้องระวังเรื่อง `birthdate` และการแสดงผลเวลา (UTC vs Bangkok) เนื่องจากบน Chain จะเก็บเป็น Timestamp/UTC เสมอ
- **Component Fragmentation**: ระหว่างการทำ **UI Redesign** ต้องระมัดระวังโครงสร้างเดิมที่แบ่งไว้ใน `components/` หลายโฟลเดอร์ ควรมีการวาง Design System (Tokens / Tailwind Classes) ให้ชัดเจน
- **Performance/RPC Latency**: หน้าเว็บอาจโหลดช้าลงถ้าเกิด Fallback กลับไปดึง RPC ข้อมูลจาก Blockchain โดยตรง

## 5. 🖤🟡 v2 Redesign (Dark-Gold-Green) — `#jaothui-redesign-v2`
Additive dark-gold-green reskin on branch `redesign/v2` (cut from `origin/main`). New surface lives under `components/v2/` (cva primitives + `V2Layout`) and `pages/v2/*`; the live owner-demo flow (`/cert/*` detail, login loading) is **converged in place** onto v2. Legacy daisyUI shell/theme is left intact.

- **Landmarks**: `components/v2/` (primitives: Button, Badge, StatCard, BuffaloCard, WalletCard, BottomNav, FilterDrawer, Avatar, SettingsRow, SearchInput, Spinner, StatRow, RemoteImage, Pagination, V2Layout). Pages: `pages/v2/{index,buffalo,profile}.tsx`. Converged: `pages/cert/[microchip]/{index,certificate,reward}.tsx` → `components/Cert/Detail/BuffaloDetailV2.tsx`. Design contract: `DESIGN.md`.
- **🔴 Breakpoints (MUST READ)**: `tailwind.config.js` **replaces** Tailwind's default `screens`. Only these exist: `mobileS`(375) `mobileM`(425) `tabletS`(768) `tabletM`(1024) `labtop`(1440, note the spelling) `desktop`(1920) `desktopM`(2330). **`sm:` / `md:` / `lg:` / `xl:` DO NOT EXIST and fail silently** — never use them. Mobile-first; add `tabletS:` / `labtop:` upward. (Also in `DESIGN.md §8`.)
- **🔴 Modals must `createPortal` to `document.body`** — `V2Layout <main>` is `relative z-10` and traps overlays under the `z-40` nav; portal out + pinned footer (see `components/v2/FilterDrawer.tsx`).
- **🔴 Never `bun run build` while `bun run dev` runs** — corrupts `.next`. Stop dev first.
- **Auth**: reuse `useBitkubNext()` + Bitkub OAuth (`ReactBitkubNextOauth2`); do not rebuild. v2 login returns via `localStorage["bkc_post_login"]` read in `pages/oauth/callback.tsx` (default stays `/profile`).
- **📦 PR convention (updated 2026-07-22)**: operator changed the repo workflow to skip `staging`; feature branches now cut from `main` and PR directly to **`main`**. AI may open the PR when requested; operator merges.
- **🕓 Deferred TODOs (not in the owner-demo scope)**: reskin `store/*`, `game/*`, `privilege/*`, `myfarm/*`, `order/*`, `mycert`; build a real `/v2/wallet` (nav tab hidden until then); real Dark/Light theme toggle + the 4 disabled profile settings rows; upgrade `@bitkub-blockchain/react-bitkubnext-oauth2` (`^0.0.15`, pre-1.0); optional daisyUI removal (whole-app migration). Home stat numbers are still mock; News/events block dropped.

## 6. 📱 App Store Support Surface — `#jaothui-mobile-ios-internal-build`
JAOTHUI Mobile uses `https://www.jaothui.com` as its production API/web authority. App Store Connect submission requires stable public URLs, so policy/support pages live in this repo rather than the Expo app.

- **Routes**: `pages/privacy.tsx` and `pages/support.tsx`.
- **Requirements**: public, unauthenticated, production URL returns HTTP 200, no LINE/Bitkub/Apple session required.
- **Privacy scope**: public browsing; optional LINE account profile fields; optional Bitkub NEXT wallet address/email; account/session identifiers; member/farm/certificate/buffalo linkage when a user connects an identity.
- **App Store Connect values**: Privacy Policy URL `https://www.jaothui.com/privacy`; Support URL `https://www.jaothui.com/support`.

---
*Generated by Oracle on: 2026-03-05 · v2 redesign notes appended 2026-07-05 · App Store support notes appended 2026-07-22*
*Note: Ready for Phase: UI Redesign Blueprinting*
