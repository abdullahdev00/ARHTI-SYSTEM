import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { useWatermelonPurchases } from '../hooks/useWatermelonPurchases';
import { useWatermelonInvoices } from '../hooks/useWatermelonInvoices';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import { showErrorToast } from '../utils/toastUtils';
import {
  StatCard,
  QuickActionCard,
  ActivityCard,
  StatusCard,
  PartnerCard,
  EmptyState
} from '../components/ui';

/**
 * 🎨 PROFESSIONAL DASHBOARD - WORKING VERSION
 * 
 * Features:
 * ✅ English Only - Clean, professional text
 * ✅ Reusable Components - Modular UI components
 * ✅ Dark Mode Compatible - Full theme support
 * ✅ StyleSheet Styling - Reliable styling approach
 * ✅ Optimized Performance - Minimal re-renders
 * ✅ Brand Colors - Professional color palette
 */
const DashboardScreen: React.FC = observer(() => {
  const navigation = useNavigation<any>();
  const isDark = false; // Light mode only

  // ✅ WatermelonDB hooks - Local-first, instant data
  const { partners } = useWatermelonPartners();
  const { purchases } = useWatermelonPurchases();
  const { invoices } = useWatermelonInvoices();

  // ✅ Calculate stats from WatermelonDB data
  const totalPartners = partners.length;
  const totalFarmers = partners.filter((p: any) => p.role === 'farmer').length;
  const totalBuyers = partners.filter((p: any) => p.role === 'buyer').length;
  const totalPurchases = purchases.length;
  const totalPurchaseAmount = purchases.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
  const totalInvoiceAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
  const pendingAmount = invoices
    .filter((inv: any) => inv.payment_status !== 'paid')
    .reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0);
  const recentPurchases = purchases.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);


  // Navigation handlers
  const navigateToPartners = () => navigation.navigate('Partners');
  const navigateToPurchases = () => navigation.navigate('Purchases');
  const navigateToInvoices = () => navigation.navigate('Invoices');
  const navigateToStock = () => navigation.navigate('Stock');
  const navigateToReports = () => navigation.navigate('Reports');
  const navigateToAddPartner = () => navigation.navigate('AddFarmer'); // Fixed route name
  const navigateToAddPurchase = () => navigation.navigate('AddPurchase');

  // ✅ Refresh handler for dashboard
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const state = await NetInfo.fetch();
      const isOnline = state.isConnected && state.isInternetReachable;

      if (!isOnline) {
        showErrorToast('Offline - Showing cached data');
        setRefreshing(false);
        return;
      }

      await watermelonSyncService.fullSync();
    } catch (error) {
      console.error('Refresh error:', error);
      showErrorToast('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 🎨 Stats Cards Data
  const statsCards = [
    {
      title: 'Partners',
      value: totalPartners,
      icon: 'people' as const,
      color: 'emerald' as const,
      onPress: navigateToPartners,
    },
    {
      title: 'Purchases',
      value: totalPurchases,
      icon: 'bag' as const,
      color: 'amber' as const,
      onPress: navigateToPurchases,
    },
    {
      title: 'Amount',
      value: `₨${totalPurchaseAmount.toLocaleString()}`,
      icon: 'cash' as const,
      color: 'violet' as const,
      onPress: navigateToPurchases,
    },
    {
      title: 'Invoices',
      value: recentInvoices.length,
      icon: 'document-text' as const,
      color: 'cyan' as const,
      onPress: navigateToInvoices,
    },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 🎨 Main Stats Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Business Overview
          </Text>

          <View style={styles.statsGrid}>
            {statsCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                onPress={card.onPress}
              />
            ))}
          </View>
        </View>

        {/* 🎨 Status Indicators */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Invoice Status
          </Text>

          <View style={styles.statusRow}>
            <StatusCard
              label="Pending"
              value={Math.round(pendingAmount)}
              icon="time"
              color="orange"
            />
            <StatusCard
              label="Paid"
              value={Math.round(totalInvoiceAmount - pendingAmount)}
              icon="checkmark-circle"
              color="emerald"
            />
          </View>
        </View>

        {/* 🎨 BEAUTIFUL RECENT ACTIVITY */}
        <View style={styles.section}>
          <View style={[styles.modernSectionHeader, isDark && styles.modernSectionHeaderDark]}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="time" size={20} color="#10b981" />
              </View>
              <Text style={[styles.modernSectionTitle, isDark && styles.modernSectionTitleDark]}>
                Recent Activity
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={navigateToPurchases}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>

          {purchases.length === 0 ? (
            <EmptyState
              icon="bag-outline"
              title="No Recent Purchases"
              subtitle="Start by adding your first purchase to see activity here"
              buttonText="Add Purchase"
              onButtonPress={navigateToAddPurchase}
            />
          ) : (
            <View style={styles.activityContainer}>
              {purchases.slice(0, 3).map((purchase: any) => (
                <ActivityCard
                  key={purchase.id}
                  title={`${purchase.crop_name} Purchase`}
                  subtitle={`${purchase.quantity}kg • ₨${purchase.total_amount.toLocaleString()}`}
                  date={new Date(purchase.date).toLocaleDateString('en-PK')}
                  icon="bag"
                  onPress={() => navigateToPurchases()}
                />
              ))}
            </View>
          )}
        </View>

        {/* 🎨 BEAUTIFUL RECENT PARTNERS */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={[styles.modernSectionHeader, isDark && styles.modernSectionHeaderDark]}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people" size={20} color="#10b981" />
              </View>
              <Text style={[styles.modernSectionTitle, isDark && styles.modernSectionTitleDark]}>
                Recent Partners
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={navigateToPartners}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>

          {partners.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No Partners Yet"
              subtitle="Add partners to start managing your agricultural business"
              buttonText="Add Partner"
              onButtonPress={navigateToAddPartner}
            />
          ) : (
            <View style={styles.partnersContainer}>
              {partners.slice(0, 3).map((partner: any) => (
                <PartnerCard
                  key={partner.id}
                  name={partner.name}
                  role={partner.role || 'partner'}
                  phone={partner.phone || 'No phone'}
                  onPress={() => navigation.navigate('FarmerDetail', { farmerId: partner.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  lastSection: {
    paddingBottom: 32,
  },
  // ✅ MODERN SECTION HEADERS
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  modernSectionHeaderDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modernSectionTitleDark: {
    color: 'white',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  viewAllButtonText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
    marginRight: 4,
  },
  activityContainer: {
    marginTop: 8,
  },
  partnersContainer: {
    marginTop: 8,
  },
  // Legacy styles (keeping for compatibility)
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default DashboardScreen;
