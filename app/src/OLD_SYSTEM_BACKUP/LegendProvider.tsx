import React, { useEffect } from 'react'
import { observer } from '@legendapp/state/react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useAppState } from '../hooks/useLegendState'

interface LegendProviderProps {
  children: React.ReactNode
}

/**
 * Legend State Provider - Complete Backend Sync System
 * Handles initialization, real-time sync, and loading states
 */
export const LegendProvider: React.FC<LegendProviderProps> = observer(({ children }) => {
  const { isInitialized, isLoading, initialize, setupRealtime } = useAppState()

  useEffect(() => {
    // Initialize Legend State on app start
    const init = async () => {
      await initialize()
      // Setup real-time subscriptions after initialization
      setupRealtime()
    }
    
    init()
  }, [])

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingTitle}>🚀 Initializing Backend...</Text>
        <Text style={styles.loadingSubtitle}>Setting up real-time sync with database</Text>
        <View style={styles.features}>
          <Text style={styles.feature}>✅ Observable state management</Text>
          <Text style={styles.feature}>✅ Real-time database sync</Text>
          <Text style={styles.feature}>✅ Offline-first architecture</Text>
          <Text style={styles.feature}>✅ Automatic UI updates</Text>
        </View>
      </View>
    )
  }

  return <>{children}</>
})

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center'
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30
  },
  features: {
    alignItems: 'flex-start'
  },
  feature: {
    fontSize: 12,
    color: '#4CAF50',
    marginVertical: 2,
    fontWeight: '500'
  }
})
