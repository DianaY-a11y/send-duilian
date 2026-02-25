# 对联 - Send a Couplet 🧧

A fun, cartoon-style web app where users can pick a couplet design, handwrite with a 毛笔 (Chinese brush), and share their creation with friends!

## Features

- 🎨 4 beautiful couplet templates to choose from
- ✍️ Realistic brush writing simulation (毛笔 style)
- 🎨 Multiple ink colors (black, brown, gold, blue)
- ↩️ Undo and clear functionality
- 📤 Save and get instant shareable link
- 📋 Auto-copy link to clipboard
- 🎁 Beautiful gift viewing page with animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel-ready

## Getting Started

### 1. Clone and Install

```bash
cd 对联
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase.sql`
3. Go to **Storage** and create a new bucket called `gifts`
   - Toggle **Public** access ON for the bucket
4. Go to **Settings > API** to get your keys

### 3. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Add Template Images

Place your couplet template images in `/public/templates/`:
- `template-1.png`
- `template-2.png`
- `template-3.png`
- `template-4.png`

The app includes placeholder SVG templates that work out of the box!

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing + Editor
│   ├── g/[slug]/page.tsx     # Gift view page
│   ├── api/gifts/
│   │   ├── route.ts          # POST - create gift
│   │   └── [slug]/route.ts   # GET - fetch gift
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── TemplateGrid.tsx      # Template picker
│   ├── EditorOverlay.tsx     # Fullscreen editor
│   ├── BrushCanvas.tsx       # Drawing canvas
│   └── Toast.tsx             # Notifications
├── templates/
│   └── templates.ts          # Template config
└── lib/
    ├── supabase/
    │   ├── server.ts         # Server client
    │   └── client.ts         # Browser client
    └── utils/
        ├── nanoid.ts         # ID generation
        └── dataUrl.ts        # Image utilities
```

## Usage

1. **Pick a Template**: Click on one of the 4 couplet designs
2. **Write**: Use your mouse or touch to write with the brush
3. **Customize**: Change ink color or brush size as needed
4. **Undo/Clear**: Fix mistakes with undo or start fresh
5. **Save & Send**: Click the button to generate your shareable link
6. **Share**: The link is copied to clipboard - send it to friends!

## Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Remember to update `NEXT_PUBLIC_BASE_URL` to your production domain.

## License

MIT - Feel free to use and modify! 🎉
