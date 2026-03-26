# DimensionDownload For Study

<div align="center">

![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.11-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Compatible-3ECF8E?style=for-the-badge&logo=supabase)

**AI Research Platform for Video Download, Summary & 3D Conversion**

[Demo](#) | [Docs](#documentation) | [Legal](#disclaimer)

</div>

---

## Key Features

* **BYOK (Bring Your Own Key)**: Full control over costs. Users enter personal API keys for YouTube and Google Gemini, encrypted and stored securely with AES-256-GCM.
* **Smart Playlist Fetching**: Automatic collection of complete playlists from YouTube in real-time using Pagination, with manual selection of specific videos for download.
* **AI 3D Processing**: Convert regular 2D video to 3D format (Anaglyph red-blue) using depth models. Includes on/off toggle to save processing resources.
* **AI Content Analysis**: Automatic generation of summaries and insights for each video using Gemini 1.5 Pro model.
* **Temporary Managed Storage**: Processed files are stored in Supabase for 44 days only. A countdown timer is displayed next to each file showing when it will be deleted from the server.
* **AI Recaps Maker**: 6-step wizard for creating AI-powered video recaps with Google Gemini.
* **Gamification System**: XP, achievements, daily challenges, and leaderboards.
* **Multi-language Support**: 24 languages with full RTL support.

---

## Prerequisites

Before installing and running the system, ensure you have:

1. **Stable internet connection**: Required for downloading files and communicating with API services.
2. **API Keys**: Active Google Cloud account (for YouTube Data API v3) and Gemini API key.
3. **Supported hardware**: For local 3D processing, a dedicated GPU is recommended (e.g., NVIDIA RTX 4050+).
4. **Read Terms of Use**: You must read and accept the Disclaimer section below.

---

## Installation

### Option 1: Quick Install with Docker (Recommended)

This method installs the entire environment, including yt-dlp and models, automatically:

```bash
docker-compose up --build
```

### Option 2: Manual Setup

* **Backend (Go)**: Install Go and ensure yt-dlp and FFmpeg are installed on your system.
* **Frontend (React)**: Navigate to the client directory and run `npm install` to install React and TypeScript packages.
* **Database**: Set up a Supabase project and prepare connection credentials.

### Option 3: Frontend Only (Development)

```bash
git clone https://github.com/yaskovbs/AI-Recaps-Maker-9bgbn2.git
cd AI-Recaps-Maker-9bgbn2
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

The application will run at `http://localhost:5173`

---

## Environment Variables

Create a `.env` file in the project root directory (do not upload this file to GitHub):

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (BYOK) - Set through the app Settings page
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# App Settings
ENABLE_3D_PROCESSING=true  # Set to false to disable 3D processing by default
```

### API Keys (BYOK)

Keys are managed through the app **Settings > API Settings** page:

| API | Description | How to Get |
|-----|-------------|------------|
| **YouTube Data API v3** | YouTube access | [Google Cloud Console](https://console.cloud.google.com/) |
| **Google Search API** | Web search | [Google Cloud Console](https://console.cloud.google.com/) |
| **Search Engine ID** | Search engine identifier | [Programmable Search Engine](https://programmablesearchengine.google.com/) |
| **Google Gemini API** | AI for summaries | [Google AI Studio](https://makersuite.google.com/app/apikey) |

---

## Usage Guide

1. **Enter source**: Paste a YouTube video/playlist link or upload a local video file (MP4).
2. **Select videos**: For playlists, select desired videos from the card list that loads on screen.
3. **Configure settings**: Decide whether to enable the 3D toggle or just use text summaries.
4. **Process**: Click Start. The system will download, process, and generate insights.
5. **Track time**: Download ready files to your computer before the countdown timer reaches 0 (44 days).

---

## System Architecture

### Tech Stack

| Technology | Version | Description |
|-----------|---------|-------------|
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.5+ | Type Safety |
| **Vite** | 5.4.1 | Build Tool |
| **Tailwind CSS** | 3.4.11 | Utility-First CSS |
| **React Router** | 6.x | Navigation |
| **React Query** | 5.x | State Management |
| **Supabase** | 2.x | Backend as a Service |
| **Framer Motion** | 12.x | Animations |
| **Recharts** | 2.x | Charts |
| **Three.js** | 0.181 | 3D Rendering |
| **Go** | 1.21+ | Backend Processing |

### Database Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `user_profiles` | User profiles | Enabled |
| `api_keys` | Encrypted API keys | Enabled |
| `user_preferences` | User settings | Enabled |
| `credits_wallet` | Credits balance | Enabled |
| `credits_transactions` | Transaction history | Enabled |
| `learning_profiles` | AI learning data | Enabled |
| `youtube_channels` | YouTube learning channels | Enabled |
| `video_tasks` | Video download/processing tasks | Enabled |
| `playlist_items` | Playlist video items | Enabled |
| `task_logs` | Processing logs | Enabled |
| `ratings` | User ratings | Enabled |
| `contact_submissions` | Contact form submissions | Enabled |

### Project Structure

```
project/
├── public/               # Static files
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── ads/          # AdSense components
│   │   ├── charts/       # Chart wrappers
│   │   ├── layout/       # Header, Footer
│   │   ├── steampunk/    # Theme animations
│   │   ├── video/        # Video task components
│   │   │   ├── VideoTaskCard.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── TaskDetailsModal.tsx
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   └── BatchActionsBar.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── Create.tsx        # 6-step recap wizard
│   │   ├── MyVideos.tsx      # Video tasks management
│   │   ├── MyRecaps.tsx      # Recap management
│   │   ├── Disclaimer.tsx    # Legal disclaimer
│   │   ├── Settings.tsx      # Settings + BYOK
│   │   ├── Analytics.tsx     # Statistics
│   │   └── ...
│   ├── hooks/
│   │   ├── useVideoTasks.ts  # Video task management
│   │   ├── useWallet.ts      # Credits system
│   │   └── ...
│   ├── lib/
│   │   ├── videoTaskService.ts    # Task CRUD operations
│   │   ├── videoTaskTypes.ts      # Type definitions
│   │   ├── AuthContext.tsx         # Authentication
│   │   ├── supabase.ts            # Supabase client
│   │   └── ...
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/       # Database migrations
└── package.json
```

---

## DimensionDownload Features

### Video Task Management

The My Videos page (`/my-videos`) provides full task management:

- **Search & Filter**: Search by name, filter by status/priority, sort by date/name/expiration
- **Batch Operations**: Select multiple tasks for bulk delete or cancel
- **Real-time Updates**: Tasks auto-refresh every 30 seconds when processing is active
- **Supabase Realtime**: Live database change notifications via WebSocket

### Countdown Timer

Each completed file displays a countdown timer showing time until automatic deletion:

- **Green**: More than 7 days remaining (safe)
- **Yellow**: 1-7 days remaining (warning)
- **Red (flashing)**: Less than 24 hours remaining (critical)

### Task Processing Pipeline

```
1. Download (YouTube/Upload)
2. Validate & Extract metadata
3. Process video (FFmpeg)
4. AI Summary (Gemini)
5. Convert to 3D (optional)
6. Upload to Storage
7. Set 44-day expiration
```

### Error Handling

Tasks include detailed error codes with user-friendly messages and suggested actions:

| Error Code | Description |
|-----------|-------------|
| `ERR_DOWNLOAD_FAILED` | Video download failed |
| `ERR_PROCESSING_TIMEOUT` | Processing took too long |
| `ERR_INVALID_FORMAT` | Unsupported file format |
| `ERR_3D_CONVERSION` | 3D conversion failed |
| `ERR_STORAGE_FULL` | Storage quota exceeded |
| `ERR_API_QUOTA` | API quota exceeded |

---

## Deployment

### Cloudflare Pages (Recommended)

1. Connect GitHub repository to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Build settings:
   ```
   Build command: npm install && npm run build
   Build output: dist
   ```
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=22`
4. Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## Disclaimer

**Important**: DimensionDownload For Study is intended for personal and educational use only.

* **User Responsibility**: All downloading of content from YouTube or any other source is the sole responsibility of the user.
* **Copyright**: It is strictly prohibited to use this tool for downloading content for re-upload, commercial distribution, or any action that violates the copyright of content owners.
* **Recommendation**: We strongly recommend using this tool exclusively for videos from your personal channel or content for which you have explicit permission to download.
* **44-Day Policy**: All processed files are stored temporarily for 44 days only. After this period, files are automatically and permanently deleted from the server.

---

## Contact & Support

**Y-L-B-S AI Studio Apps**

- Email: [contact-us@y-l-b-s-ai-studio-apps.com](mailto:contact-us@y-l-b-s-ai-studio-apps.com)
- Phone: 050-818-1948
- GitHub: [@yaskovbs](https://github.com/yaskovbs)
- Linktree: [ylbsaistudioapps](https://linktr.ee/ylbsaistudioapps)
- YouTube: [Movies & TV Show Recap](https://www.youtube.com/@MoviesandTVShowRecap)

---

## License

MIT License

Copyright (c) 2026 AI Recaps Maker / DimensionDownload For Study

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

Made with care by Y-L-B-S AI Studio Apps

</div>
