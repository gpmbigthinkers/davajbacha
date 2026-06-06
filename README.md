# DAVAJ-BACHA

> Diagnostická a vzdelávacia platforma pre digitálnu odolnosť žiakov.

**DAVAJ-BACHA** je webová platforma, ktorá žiakov naučí bezpečne reagovať na online hrozby — grooming, phishing, deepfake manipuláciu a kyberšikanu — skôr, než príde skutočný incident. Vyvinutá v rámci **Ideathon 2026 — GPM Park mládeže Košice**.

---

## 🎯 Čo platforma ponúka

| Modul | Popis |
|-------|-------|
| **Simulátor scenárov** | 10 realistických situácií s okamžitou spätnou väzbou |
| **Digitálna stopa** | Interaktívny profilový test — čo sa dá odvodiť z verejných príspevkov |
| **Školský dashboard** | Agregované triedné štatistiky, 100% anonymné |
| **QR vstup** | Žiaci sa pripoja bez loginu — len cez vstupný kód od učiteľa |

---

## 🛠 Tech stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Efekty:** Three.js (liquid-ether hero), Motion
- **ORM:** [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- **AI:** [OpenRouter](https://openrouter.ai) (generovanie balíkov, verifikácia digitálnej stopy)
- **Auth:** Session cookie + bcrypt (dashboard pre učiteľov)

---

## 🚀 Lokálny setup

### 1. Klonuj repozitár

```bash
git clone https://github.com/gpmbigthinkers/davajbacha.git
cd davajbacha
```

### 2. Inštaluj závislosti

```bash
pnpm install
```

> Projekt používa `pnpm`. Ak ho nemáš nainštalovaný:
> ```bash
> npm install -g pnpm
> ```

### 3. Nastav prostredie

Skopíruj `.env.example` do `.env.local`:

```bash
cp .env.example .env.local
```

Uprav premenné:

| Premenná | Popis |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (odporúčame [Supabase](https://supabase.com)) |
| `DATABASE_SSL` | `false` pre lokálny vývoj, `require` pre Supabase |
| `AUTH_SECRET` | Náhodný 64-znakový hex reťazec pre session cookies |
| `ADMIN_PASSWORD` | Heslo pre prvý admin účet (vytvorený seedom) |
| `OPENROUTER_API_KEY` | API kľúč pre AI funkcie (voliteľné, bez neho AI featury nejdú) |
| `OPENROUTER_MODEL` | Model na OpenRouteri (default: `google/gemini-2.0-flash-001`) |

**Vygeneruj AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Vytvor databázu

```bash
# Vygeneruj migrácie (ak ešte neexistujú)
pnpm db:generate

# Spusť migrácie — vytvorí tabuľky
pnpm db:migrate

# Napln databázu demo dátami (škola, trieda, scenáre, admin)
pnpm db:seed
```

Seed vytvorí:
- školu: *GPM Park mladeze Kosice*
- triedu: *2.B*
- admina: `admin@gpm.sk` s heslom z `ADMIN_PASSWORD`
- 10 scenárových templátov

### 5. Spusť dev server

```bash
pnpm dev
```

Otvor [http://localhost:3000](http://localhost:3000).

### 6. Ďalšie príkazy

```bash
pnpm build      # Production build
pnpm start      # Production server
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
pnpm test       # Vitest unit testy
```

---

## 📁 Štruktúra projektu

```
src/
├── app/              # Next.js App Router
│   ├── api/          # REST API route handlers
│   ├── dashboard/    # Školský dashboard (auth required)
│   ├── scenar/       # Simulátor scenárov
│   ├── digitalna-stopa/   # Digitálna stopa
│   ├── vstup/        # QR/vstupný kód pre žiakov
│   ├── login/        # Prihlásenie pre učiteľov
│   └── page.tsx      # Landing page
├── components/
│   ├── platform/     # Hlavné platformové komponenty
│   ├── reactbits/    # Hero efekty (liquid-ether)
│   └── ui/           # shadcn/ui komponenty
├── db/
│   ├── schema.ts     # Drizzle schéma
│   ├── client.ts     # DB klient
│   └── seed.ts       # Demo dáta
├── lib/
│   ├── auth.ts       # Auth helpers (bcrypt, session)
│   ├── platform-data.ts      # Scenárové dáta
│   ├── platform-repository.ts # DB queries
│   ├── scoring.ts    # Bodovanie odpovedí
│   └── openrouter.ts # AI klient
└── scripts/          # Pomocné skripty
```

---

## 🧪 Testy

```bash
# Spusť všetky testy
pnpm test

# Watch mode
pnpm vitest
```

Unit testy pokrývajú:
- bodovanie scenárov (`scoring.test.ts`)
- verifikáciu digitálnej stopy (`footprint-verification.test.ts`)
- AI API endpointy (`verify-footprint/route.test.ts`)

---

## 🎨 UI konvencie

- **Farby:** Primárna `#4c1d95` (fialová), akcent `#ec4899` (ružová)
- **Fonty:** Cormorant Garamond (nadpisy), Plus Jakarta Sans (text)
- **Komponenty:** shadcn/ui s vlastnými overridmi
- **Animácie:** Framer Motion pre prechody, Three.js canvas pre hero sekciu

---

## 🏗 Deploy

Odporúčaná cesta:

1. **Vercel** pre frontend
2. **Supabase** pre PostgreSQL
3. Pridaj environment premenné vo Vercel dashboarde
4. Spusť `drizzle-kit migrate` cez CLI alebo CI/CD

---

## 📝 Licencia

© 2026 DAVAJ-BACHA — vyvinuté v rámci Ideathon 2026, GPM Park mládeže Košice.

---

**Dávaš bacha?** Žiaci áno. 🧠🔒
