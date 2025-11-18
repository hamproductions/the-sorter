# Setlist Prediction Feature - Documentation Index

> **Fantasy football for Love Live! setlists** - Predict performances, compete with friends, share for laughs in group chats! 🎤✨

## 📚 Documentation Structure

This documentation is split into focused sections for easier consumption:

### Core Documentation

1. **[LLFans Integration](./LLFANS_INTEGRATION.md)** ⭐ START HERE
   - LLFans data structure analysis
   - Mapping LLFans data to prediction models
   - Using existing fetch scripts
   - Performance, concert, and setlist schemas

2. **[Data Models](./DATA_MODELS.md)**
   - TypeScript interfaces
   - Data relationships
   - Storage schemas
   - Extended models for predictions

3. **[User Flows](./USER_FLOWS.md)**
   - Creating predictions
   - Building setlists
   - Marking mode
   - Sharing & comparing

4. **[UI Components](./UI_COMPONENTS.md)**
   - Component hierarchy
   - Detailed component specs
   - Layout patterns (desktop/mobile)
   - Reusable components from existing codebase

### Implementation Guides

5. **[Technical Architecture](./TECHNICAL_ARCHITECTURE.md)**
   - Directory structure
   - State management (frontend-first!)
   - Drag & drop implementation
   - LocalStorage strategy

6. **[Scoring System](./SCORING_SYSTEM.md)**
   - Scoring algorithm
   - Match types (exact, close, present)
   - Bonus points
   - Configurable rules

7. **[Import/Export](./IMPORT_EXPORT.md)**
   - Share URLs (for group chats!)
   - JSON format
   - PNG/image export
   - QR codes

8. **[Localization](./LOCALIZATION.md)**
   - Translation keys
   - EN/JA support
   - Best practices

### Planning & Features

9. **[Implementation Plan](./IMPLEMENTATION_PLAN.md)**
   - Phase 1: MVP (frontend-only)
   - Phase 2: Optional backend (later)
   - Priority matrix
   - Task breakdown

10. **[Spicy Features](./SPICY_FEATURES.md)** 🌶️
    - Performance Bingo
    - Prediction Heatmaps
    - Setlist Diff Tool
    - Song Performance Trends
    - Social Prediction Rooms

## 🎯 Quick Start

### For Implementers
1. Read [LLFans Integration](./LLFANS_INTEGRATION.md) to understand the data
2. Review [Data Models](./DATA_MODELS.md) for TypeScript types
3. Check [Implementation Plan](./IMPLEMENTATION_PLAN.md) for task breakdown
4. Start building! Everything is designed frontend-first with LocalStorage

### For Reviewers
1. Check [User Flows](./USER_FLOWS.md) for UX overview
2. Review [UI Components](./UI_COMPONENTS.md) for interface design
3. Read [Spicy Features](./SPICY_FEATURES.md) for fun stuff

## 🎨 Design Philosophy

- **Frontend-first**: Everything works locally, no server required for MVP
- **Share-friendly**: Easy URL sharing for group chats
- **Data-driven**: Built on LLFans data
- **Flexible**: Easy to extend and customize
- **Fun**: Gamification and social features

## 🚀 MVP Scope (Phase 1)

**Goal**: Shareable setlist prediction game for group chats

- ✅ Performance selection (from LLFans data)
- ✅ Drag-and-drop setlist builder
- ✅ Multiple prediction slots
- ✅ Scoring & marking mode
- ✅ Share URLs (compressed)
- ✅ PNG export for sharing
- ✅ Full localization (EN/JA)
- ✅ LocalStorage persistence
- ❌ No backend/server
- ❌ No user accounts (yet)

## 📊 Key Features

### Phase 1 (MVP - Frontend Only)
- Build predictions for any LLFans performance
- Drag-and-drop song ordering
- Custom songs & non-song items (MC, VTR, etc.)
- Multiple prediction saves per performance
- View song performance history
- Score predictions against actual setlists
- Export as image/JSON/text
- Share via URL/QR code
- Performance Bingo mode 🎲

### Phase 2 (Optional - With Backend)
- User accounts & cloud sync
- Leaderboards
- Public predictions
- Real-time collaboration
- Community heatmaps

## 🛠️ Tech Stack

**Frontend** (Phase 1):
- React 19 + TypeScript
- Vike (SSR/SSG)
- Panda CSS (styling)
- @dnd-kit (drag-and-drop)
- lz-string (URL compression)
- modern-screenshot (PNG export)
- LocalStorage (persistence)

**Backend** (Phase 2 - Later):
- TBD (Firebase/Supabase/custom)
- Focus on frontend first!

## 📝 Design Principles

1. **Local-first**: Works offline, syncs optionally
2. **Reuse existing patterns**: Leverage current sorter components
3. **Share-optimized**: Compressed URLs for easy sharing
4. **Mobile-friendly**: Responsive design
5. **Accessible**: Keyboard navigation, screen readers
6. **Performant**: Virtual scrolling, lazy loading

## 🔗 Related Files

- Main spec: `/SETLIST_PREDICTION_SPEC.md` (comprehensive reference)
- Existing sorter: `/src/pages/songs/` (patterns to reuse)
- Data examples: `/data/` (structure reference)

## 🤝 Contributing

When implementing:
1. Follow existing codebase patterns (see components/sorter/)
2. Use Panda CSS for styling
3. Maintain localization (add keys to i18n/)
4. Test drag-and-drop on mobile
5. Keep bundle size reasonable

## 📞 Questions?

Refer to specific documentation sections above, or check the comprehensive spec at `/SETLIST_PREDICTION_SPEC.md`.

---

**Next Steps**: Start with [LLFans Integration](./LLFANS_INTEGRATION.md) to understand the data structure! 🚀
