# AI Recaps Maker - Implementation Plan

## Project Overview

AI Recaps Maker is a **Web Application** (not Desktop/Mobile Native) built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **PWA**: Full Progressive Web App with Service Worker
- **Theme**: Steampunk design with brass colors

## Current Status (Updated 2026-03-26)

### ✅ Completed
1. Database schema created with all required tables
2. Row Level Security (RLS) policies configured
3. Service Worker enhanced with PWA features
4. Notification service fixed with proper push support
5. Manifest updated for full PWA capabilities
6. Realtime sync added to API keys service
7. Learning service updated to match database schema

### 🚧 In Progress
- Testing all pages for broken functionality
- Build verification

### 📋 Pending
- YouTube Learning integration
- Credits system implementation
- Wallet UI completion
- Analytics dashboard
- Gamification features
- Export functionality

---

## Database Schema

### Core Tables

#### 1. `user_profiles`
- User account information
- Links to Supabase Auth
- Metadata for frozen accounts, etc.

#### 2. `api_keys`
- Encrypted API keys (AES-256-GCM)
- Providers: YouTube, Google Search, Search Engine ID, Gemini
- Key hints for display (masked)
- Per-user storage with RLS

#### 3. `user_preferences`
- Notifications settings (JSON)
- Learning preferences (JSON)
- Language preference
- All user settings in one place

#### 4. `credits_wallet`
- User credit balance
- Total earned/spent tracking
- Credit transactions history link

#### 5. `credits_transactions`
- All credit movements
- Types: reward, consume, bonus, refund
- Metadata for context

#### 6. `learning_profiles`
- Continuous learning on/off
- Global learning consent
- Learned preferences data (JSON)

#### 7. `youtube_channels`
- Learning from YouTube channels
- Up to 11 channels (1 personal + 10 inspiration)
- Sync status and metadata

#### 8. `ratings`
- User ratings of recaps
- Feedback collection

#### 9. `contact_submissions`
- Contact form submissions
- Support for both authenticated and guest users

---

## Features Implementation Roadmap

### Phase 1: Core Stability (Current)

**Goal**: Make existing features work reliably

#### Tasks:
- [x] Fix database connection issues
- [x] Implement proper RLS policies
- [x] Fix notification service
- [x] Add Service Worker for PWA
- [x] Add Realtime sync for settings
- [ ] Test Settings page thoroughly
- [ ] Test all navigation paths
- [ ] Fix any TypeScript errors
- [ ] Run production build

---

### Phase 2: BYOK (Bring Your Own Keys)

**Goal**: Secure API key management with cross-device sync

#### Features:
1. **API Key Vault**
   - PIN protection (6 digits)
   - AES-256-GCM encryption
   - Server storage + local backup
   - Key hints display (masked)
   - Realtime sync across devices

2. **Supported APIs**
   - YouTube Data API v3
   - Google Custom Search API
   - Search Engine ID
   - Google Gemini API

3. **Key Management**
   - Add/Update/Delete keys
   - Validate on save
   - Manual sync to cloud
   - Connection status indicator
   - Device list (future)

---

### Phase 3: YouTube Learning

**Goal**: Smart learning from YouTube channels

#### Features:
1. **Channel Management**
   - Add channels by URL/@handle/ID
   - Up to 11 channels default
   - Categories: Personal (1) + Inspiration (10)
   - Expandable via ads/credits

2. **Learning Scope**
   - Public videos
   - Shorts
   - Live streams
   - Last 90 days preferred

3. **Slot System**
   - 2 ads = 1 slot for 7 days
   - OR 2 credits = 1 slot for 7 days
   - No daily limit on slot purchases

4. **Refresh Options**
   - Auto: Every 24 hours (default)
   - User configurable: 1 hour to 1 week
   - Manual refresh always available

---

### Phase 4: Credits & Wallet

**Goal**: In-app economy with rewarded ads

#### Features:
1. **Credit Sources**
   - Rewarded video ads
   - Bonuses for milestones
   - Referral rewards (future)

2. **Credit Uses**
   - Create recaps (1 credit each)
   - Unlock YouTube channel slots
   - Premium features (future)

3. **Wallet UI**
   - Current balance display
   - Transaction history
   - Earn credits button
   - Analytics of spending

---

### Phase 5: Push Notifications

**Goal**: Engaging notifications across all devices

#### Features:
1. **Notification Types**
   - Recap complete
   - Weekly digest
   - Learning insights
   - Credit milestones

2. **Delivery Channels**
   - Browser push (via Service Worker)
   - Email (future - needs Edge Function)

3. **User Control**
   - Enable/disable per type
   - Enable/disable per channel
   - Test notification button
   - Permission management

---

### Phase 6: Analytics & Dashboard

**Goal**: User insights and statistics

#### Features:
1. **Recap Analytics**
   - Total created
   - Success rate
   - Popular topics
   - Time saved

2. **Learning Insights**
   - Channels learned from
   - Topics discovered
   - Preferences evolved

3. **Engagement Stats**
   - Credits earned/spent
   - Streak tracking
   - Achievements unlocked

---

### Phase 7: Gamification

**Goal**: Make the app more engaging

#### Features:
1. **Achievements**
   - First recap
   - 10 recaps milestone
   - YouTube learning master
   - Credit saver

2. **XP System**
   - Earn XP for actions
   - Level up system
   - Visual progress bar

3. **Daily Challenges**
   - Create a recap
   - Watch a rewarded ad
   - Rate a recap
   - Extra credit rewards

4. **Leaderboard**
   - Weekly/monthly rankings
   - Top creators
   - Opt-in only

---

## Technical Architecture

### Frontend Structure

```
src/
├── components/
│   ├── ads/           # AdSense & rewarded ads
│   ├── charts/        # Analytics visualizations
│   ├── chatbot/       # Gemini chatbot
│   ├── export/        # Export menu (PDF, etc.)
│   ├── gamification/  # Achievements, XP, challenges
│   ├── layout/        # Header, Footer
│   ├── social/        # Feed, trending content
│   ├── steampunk/     # Theme components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── lib/               # Services & utilities
│   ├── apiKeysService.ts
│   ├── notificationService.ts
│   ├── learningService.ts
│   ├── recapService.ts
│   ├── exportService.ts
│   ├── AuthContext.tsx
│   ├── LanguageContext.tsx
│   └── supabase.ts
└── pages/             # Route pages
    ├── Home.tsx
    ├── Create.tsx
    ├── Settings.tsx
    ├── Analytics.tsx
    ├── Wallet.tsx
    ├── YouTubeLearning.tsx
    ├── Leaderboard.tsx
    └── ...
```

### Backend (Supabase)

- **Database**: PostgreSQL with RLS
- **Auth**: Email/password (current)
- **Storage**: For user uploads and generated content
- **Realtime**: For cross-device sync
- **Edge Functions**: For background jobs (future)

---

## Security & Privacy

### API Keys
- ✅ AES-256-GCM encryption
- ✅ Server-side storage
- ✅ Encrypted local backup
- ✅ Never exposed in logs
- ✅ Key hints only (masked)
- ✅ Per-user isolation (RLS)

### Learning Data
- Personal learning: Always active, private
- Global learning: Opt-in only
- Monthly consent renewal (future)
- Anonymization before aggregation
- Hash IDs, mask sensitive text
- No usernames in global data

### User Data
- RLS on all tables
- Users see only their own data
- Encrypted API keys
- Secure session management
- HTTPS only

---

## Deployment Strategy

### Build Process
```bash
npm run build
```

### Hosting Options
1. **Primary**: Netlify/Vercel (current setup)
2. **Alternative**: Cloudflare Pages
3. **PWA**: Self-hostable via Service Worker

### Environment Variables
Required in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:
- AdMob/AdSense keys (for monetization)

---

## Testing Strategy

### Manual Testing Checklist
- [ ] User registration flow
- [ ] Login/logout
- [ ] Settings page (all sections)
- [ ] API key save/load/sync
- [ ] Notifications enable/test
- [ ] Learning preferences save
- [ ] Language switching
- [ ] Account freeze/delete
- [ ] Mobile responsiveness
- [ ] PWA installation
- [ ] Offline mode

### Automated Testing (Future)
- Unit tests for services
- Integration tests for flows
- E2E tests with Playwright
- Build verification in CI

---

## Performance Optimization

### Current
- Lazy loading components
- Service Worker caching
- Efficient database queries
- Realtime only when needed

### Future
- Code splitting by route
- Image optimization
- Bundle size reduction
- CDN for static assets

---

## Roadmap Timeline

### Q2 2026
- ✅ Core database setup
- ✅ PWA features
- ✅ Settings page fixes
- 🚧 Build verification
- 📋 YouTube Learning (partial)

### Q3 2026
- YouTube Learning (complete)
- Credits & Wallet
- Push Notifications (full)
- Analytics Dashboard

### Q4 2026
- Gamification
- Export features
- Social features
- Leaderboard

### 2027+
- AI enhancements
- More integrations
- Mobile app (React Native)
- Desktop app (Electron)

---

## Migration from Old Plans

### ❌ Not Applicable (Removed from scope)
- Desktop clients (macOS/Windows/Linux)
- Mobile native apps (Android/iOS)
- Unity integration
- Expo/EAS deployment
- Clerk authentication (using Supabase Auth)
- FFmpeg pipeline (not implemented yet)
- Multiple client profiles

### ✅ Retained & Adapted
- BYOK concept
- YouTube Learning
- Credits system
- Notifications
- Learning preferences
- Gamification ideas
- Security best practices

---

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Tailwind CSS for styling
- shadcn/ui components
- RTL support for Hebrew/Arabic

---

## Support & Documentation

### User Guides
- [ ] Getting started guide
- [ ] API key setup guide
- [ ] YouTube Learning guide
- [ ] Credits & Wallet FAQ
- [ ] Troubleshooting

### Developer Docs
- [x] Database schema
- [x] RLS policies
- [ ] API reference (Edge Functions)
- [ ] Service Worker guide
- [ ] Deployment guide

---

## Contact & Feedback

- GitHub Issues: For bug reports
- Contact Form: In-app support
- Email: (to be added)

---

**Last Updated**: 2026-03-26
**Status**: Active Development
**Version**: v1.0.0-beta
