# Warehouse Management System (WMS) Mini Project

Sistem manajemen gudang modern yang dibangun dengan fokus pada efisiensi stok, pelacakan lokasi (*Bin Management*), dan pengendalian barang kedaluwarsa (*FEFO - First Expired First Out*).

---

## Tech Stack
Project ini menggunakan arsitektur **Fullstack TypeScript** dengan performa tinggi:

* **Frontend**: [Next.js 14+](https://nextjs.org/) (App Router) & [Shadcn/UI](https://ui.shadcn.com/)
* **Backend**: [NestJS](https://nestjs.com/) (Modular Architecture)
* **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
* **Package Manager**: [pnpm](https://pnpm.io/)
* **Auth**: JWT (JSON Web Token) & Bcrypt

---

## Project Structure
```text
.
├── backend/            # NestJS API Service
├── frontend/           # Next.js Client Application
├── docs/               # Detailed Documentation (The "Antigravity" Way)
│   ├── ARCHITECTURE.md # ERD & Database Logic
│   ├── WORKFLOW.md     # Inbound, Outbound, & FEFO Rules
│   ├── API_SPEC.md     # API Endpoints & Auth
│   └── ROADMAP.md      # 7-Day Sprint Progress
├── pnpm-workspace.yaml # pnpm workspace configuration
└── README.md           # This file