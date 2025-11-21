import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { FilterBottomSheet } from '../components';
import AddPartnerBottomSheet, { AddRoleModal } from '../components/AddPartnerBottomSheet';

import { useFilterSystem } from '../hooks';
import { getFilterConfig } from '../config';
import { observer } from '@legendapp/state/react';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { useWatermelonRoles } from '../hooks/useWatermelonRoles';
import { showErrorToast } from '../utils/toastUtils';
import { watermelonSyncService } from '../services/watermelonSyncService';
import { supabase } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';
import {
  StatsOverview,
  PartnerCard,
  EmptyState,
  FloatingActionButton,
  SearchHeader
} from '../components/ui';

/**
 * PARTNERS SCREEN - WHATSAPP STYLE REDESIGN
 * WhatsApp-style white/dark theme
 * Maximum screen space utilization
 * Professional components
 * Legend State + Supabase backend
 * ✅ Maximum screen space utilization
 * ✅ Professional components
 * ✅ Legend State + Supabase backend
 */
const PartnersScreen: React.FC = observer(() => {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ✅ Fresh sync system with WatermelonDB (local-first, instant)
  const { partners, deletePartner, reloadPartners } = useWatermelonPartners();
  const { roles } = useWatermelonRoles();

  console.log('👥 PartnersScreen - Partners loaded:', partners.length);
  console.log('🏷️ PartnersScreen - Roles loaded:', roles.length);

  // ✅ UI state
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showAddPartnerSheet, setShowAddPartnerSheet] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ✅ Dynamic filter config with real-time roles
  const filterConfig = useMemo(() => {
    const baseConfig = getFilterConfig('farmers');
    return {
      ...baseConfig,
      filterOptions: baseConfig.filterOptions.map(option => {
        if (option.key === 'partner_type') {
          return {
            ...option,
            options: roles.map(role => ({
              value: role.id,
              label: role.name,
            })),
          };
        }
        return option;
      }),
    };
  }, [roles]);

  const {
    searchQuery,
    setSearchQuery,
    isFilterModalOpen,
    setIsFilterModalOpen,
    selectedFilters,
    handleFilterChange,
    clearAllFilters,
    getActiveFiltersCount,
    filteredData: allFilteredPartners,
  } = useFilterSystem(partners, filterConfig);

  // ✅ Apply role filter on top of other filters
  const filteredPartners = useMemo(() => {
    if (!selectedRoleFilter) {
      console.log('🔍 Filter: All partners -', allFilteredPartners.length);
      return allFilteredPartners;
    }

    // Get the role name from the selected role ID
    const selectedRole = roles.find(r => r.id === selectedRoleFilter);
    const selectedRoleName = selectedRole?.name;

    console.log('🔍 Filtering by role ID:', selectedRoleFilter);
    console.log('🏷️ Role name:', selectedRoleName);
    console.log('📋 All partners before filter:', allFilteredPartners.map(p => ({ name: p.name, role: p.role })));

    const filtered = allFilteredPartners.filter(partner => {
      // Case-insensitive comparison
      const match = partner.role?.toLowerCase() === selectedRoleName?.toLowerCase();
      console.log(`  Partner: ${partner.name}, Role: ${partner.role}, Selected: ${selectedRoleName}, Match: ${match}`);
      return match;
    });
    console.log('✅ Filter: Role -', selectedRoleName, 'Count -', filtered.length);
    return filtered;
  }, [allFilteredPartners, selectedRoleFilter, roles]);

  // ✅ Unified refresh function - used by both swipe and button
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Check network status
      const state = await NetInfo.fetch();
      const isOnline = state.isConnected && state.isInternetReachable;

      if (!isOnline) {
        console.log('📴 Offline - Cannot refresh');
        showErrorToast('You are offline');
        setRefreshing(false);
        return;
      }

      const startTime = Date.now();
      console.log('🔄 [REFRESH START] Fetching Partners data from Supabase...');
      console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);

      // Fetch Partners data from WatermelonDB
      await watermelonSyncService.fullSync();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('✅ [REFRESH COMPLETE] Partners data loaded from Supabase');
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`📊 Loaded: Partners (Roles via useRoles hook)`);
      console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ [REFRESH ERROR] Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ✅ Delete partner locally (instant) + sync to Supabase
  const handleDeletePartner = useCallback(async (partnerId: string, partnerName: string) => {
    Alert.alert(
      'Delete Partner',
      `Are you sure you want to delete ${partnerName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting partner:', partnerName);
              await deletePartner(partnerId);
              console.log('✅ Partner deleted');

              // Reload to update UI
              await reloadPartners();
              console.log('🔄 Partners reloaded after delete');

              showErrorToast(`${partnerName} deleted`);
            } catch (error) {
              console.error('❌ Delete error:', error);
              showErrorToast('Failed to delete partner');
            }
          },
        },
      ]
    );
  }, [deletePartner, reloadPartners]);

  // ✅ Bottom sheet handlers
  const handleAddPartner = () => {
    setEditingPartnerId(null);
    setShowAddPartnerSheet(true);
  };

  const handleEditPartner = (partnerId: string) => {
    setEditingPartnerId(partnerId);
    setShowAddPartnerSheet(true);
  };

  const handleClosePartnerSheet = () => {
    console.log('🔄 Bottom sheet closed - reloading partners');
    reloadPartners();
    setShowAddPartnerSheet(false);
    setEditingPartnerId(null);
  };

  const navigateToPartnerDetail = (partnerId: string) => {
    navigation.navigate('FarmerDetail', { partnerId });
  };

  // ✅ Dynamic header based on search state
  React.useLayoutEffect(() => {
    console.log('🔍 Search state changed:', isSearchVisible);
    if (isSearchVisible) {
      // Search mode - use reusable SearchHeader component
      navigation.setOptions({
        headerTitle: '',
        headerLeft: () => (
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClose={() => {
              setSearchQuery('');
              setIsSearchVisible(false);
            }}
            onFilterPress={() => setIsFilterModalOpen(true)}
            filterCount={getActiveFiltersCount()}
            placeholder="Search partners..."
          />
        ),
        headerRight: () => null,
      });
    } else {
      // Normal mode - show title and search icon
      navigation.setOptions({
        headerTitleContainerStyle: undefined,
        headerTitle: 'Partners',
        headerLeft: undefined,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <TouchableOpacity
              style={{
                padding: 8,
              }}
              onPress={() => setIsSearchVisible(true)}
            >
              <Ionicons name="search" size={22} color="#1c1c1e" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, isSearchVisible, searchQuery]);

  // ✅ Reload partners when screen comes into focus (after add/edit/delete)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 PartnersScreen focused - reloading partners')
      reloadPartners()
    }, [reloadPartners])
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* ✅ Same content area as original */}
      {/* ✅ FLATLIST FOR PERFORMANCE */}
      <FlatList
        data={filteredPartners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
          />
        }
        ListHeaderComponent={
          /* ✅ ROLE FILTER BAR */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roleFilterBar}
            contentContainerStyle={styles.roleFilterContent}
            scrollEnabled={true}
          >
            {/* ALL Button */}
            <TouchableOpacity
              style={[
                styles.roleFilterButton,
                !selectedRoleFilter && styles.roleFilterButtonActive,
              ]}
              onPress={() => setSelectedRoleFilter(null)}
            >
              <Text
                style={[
                  styles.roleFilterText,
                  !selectedRoleFilter && styles.roleFilterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {/* Role Buttons */}
            {roles.map(role => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleFilterButton,
                  selectedRoleFilter === role.id && styles.roleFilterButtonActive,
                ]}
                onPress={() => setSelectedRoleFilter(role.id)}
              >
                <Text
                  style={[
                    styles.roleFilterText,
                    selectedRoleFilter === role.id && styles.roleFilterTextActive,
                  ]}
                >
                  {role.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add Role Button - Capsule Style */}
            <TouchableOpacity
              style={styles.addRoleFilterButton}
              onPress={() => setShowRoleModal(true)}
            >
              <Ionicons name="add" size={18} color="#10b981" />
            </TouchableOpacity>
          </ScrollView>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Partners Found"
            subtitle="Add your first partner to get started and begin managing your business relationships"
            buttonText="Add Partner"
            onButtonPress={handleAddPartner}
          />
        }
        renderItem={({ item: partner }) => (
          <TouchableOpacity
            style={styles.partnerCard}
            onPress={() => navigateToPartnerDetail(partner.id)}
            onLongPress={() => {
              Alert.alert(
                partner.name,
                `${partner.phone || 'No phone'} • ${partner.address || 'No address'}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Edit',
                    onPress: () => handleEditPartner(partner.id),
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeletePartner(partner.id, partner.name),
                  },
                ]
              );
            }}
          >
            {/* Card Header with Role Badge */}
            <View style={styles.cardHeader}>
              <View style={styles.roleInfo}>
                <View style={styles.roleIcon}>
                  <Ionicons name="person-circle" size={32} color="#10b981" />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.roleBadge}>{partner.role || 'Partner'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => {
                  Alert.alert(
                    partner.name,
                    `${partner.phone || 'No phone'} • ${partner.address || 'No address'}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Edit',
                        onPress: () => handleEditPartner(partner.id),
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDeletePartner(partner.id, partner.name),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Card Body with Contact Info */}
            <View style={styles.cardBody}>
              {partner.phone && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={16} color="#6b7280" />
                  <Text style={styles.contactText}>{partner.phone}</Text>
                </View>
              )}
              {partner.address && (
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={16} color="#6b7280" />
                  <Text style={styles.contactText} numberOfLines={1}>{partner.address}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ✅ Same filter modal as original */}
      <FilterBottomSheet
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Partners"
        filterOptions={filterConfig.filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearAllFilters}
        resultCount={filteredPartners.length}
      />

      {/* 🎨 WHATSAPP-STYLE FLOATING ACTION BUTTON */}
      <FloatingActionButton
        onPress={handleAddPartner}
        icon="add"
      />

      {/* ✅ ADD/EDIT PARTNER BOTTOM SHEET */}
      <AddPartnerBottomSheet
        visible={showAddPartnerSheet}
        onClose={handleClosePartnerSheet}
        partnerId={editingPartnerId || undefined}
      />

      {/* ✅ ADD ROLE MODAL - Opens when + button in filter bar is clicked */}
      {showRoleModal && (
        <AddRoleModal
          visible={showRoleModal}
          onClose={() => setShowRoleModal(false)}
        />
      )}
    </View>
  );
});

// ✅ Same styles as original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  partnerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  partnerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  partnerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  partnerAddress: {
    fontSize: 14,
    color: '#666',
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  // ✅ NEW CARD STYLES
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleText: {
    flex: 1,
  },
  roleBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  cardBody: {
    paddingVertical: 12,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  divider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  // ✅ ROLE FILTER BAR STYLES
  roleFilterBar: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roleFilterContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  roleFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleFilterButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  roleFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleFilterTextActive: {
    color: 'white',
  },
  addRoleFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PartnersScreen;
