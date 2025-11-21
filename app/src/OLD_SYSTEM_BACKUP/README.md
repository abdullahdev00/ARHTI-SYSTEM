# OLD SYSTEM BACKUP

This folder contains the old SQLite + manual sync system that was replaced with the modern fresh sync system.

## Files Moved Here:

### Core System Files:
- `legendStore.ts` - Old Legend State store with manual sync
- `LegendProvider.tsx` - Old Legend State provider
- `SimpleHybridContext.tsx` - Old hybrid context provider
- `SimpleHybridManager.ts` - Old SQLite manager
- `sqliteDatabase.ts` - Old SQLite database implementation
- `useLegendState.ts` - Old Legend State hooks

### Migration System:
- `migrations.ts` - Old migration system
- `migrations/` - Old migration files folder
- `dataMigration.ts` - Old data migration utilities
- `databaseReset.ts` - Old database reset utility

### Debug Utilities:
- `expoDatabaseDebugger.ts` - Old database debugger
- `syncSetup.ts` - Old sync setup utilities

## Why These Were Removed:

### Problems with Old System:
- ❌ SQLite migration conflicts
- ❌ Manual sync complexity
- ❌ No offline persistence
- ❌ Real-time overhead
- ❌ Error-prone migrations
- ❌ Complex debugging

### New System Benefits:
- ✅ Zero migration issues
- ✅ Automatic sync
- ✅ Offline-first design
- ✅ Real-time optional
- ✅ Production-ready
- ✅ Easy debugging

## Fresh Sync System:

### New Files:
- `newSyncedStores.ts` - Modern sync stores
- `useNewSyncedData.ts` - Modern React hooks
- `NewSyncProvider.tsx` - Modern sync provider
- `FreshSyncTestScreen.tsx` - Comprehensive test interface

### Architecture:
- **Legend State** - Modern reactive state
- **Supabase Direct** - No SQLite complexity
- **MCP Integration** - Direct database management
- **Offline-First** - Complete offline support
- **Real-time Sync** - Live updates when needed

## Recovery Instructions:

If you need to restore any old functionality:

1. **Copy files back** from this backup folder
2. **Update imports** in App.tsx
3. **Restore provider hierarchy**
4. **Test thoroughly**

## Recommendation:

**Keep using the fresh sync system!** It's modern, reliable, and production-ready.

---

**Date Moved:** November 14, 2025
**Reason:** Replaced with fresh sync system
**Status:** Safe to delete after testing new system
