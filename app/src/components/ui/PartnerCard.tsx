import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PartnerCardProps {
  name: string;
  role: string;
  phone: string;
  onPress?: () => void;
}

/**
 * 🎨 WORLD-CLASS PARTNER CARD
 * ✅ Matches ActivityCard design
 * ✅ Modern glass morphism
 * ✅ Professional animations
 * ✅ Consistent visual hierarchy
 */
export const PartnerCard: React.FC<PartnerCardProps> = ({
  name,
  role,
  phone,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getRoleIcon = () => {
    return role === 'farmer' ? 'leaf' : 'business';
  };

  const getRoleColor = () => {
    return role === 'farmer' ? '#10b981' : '#3b82f6';
  };

  return (
    <TouchableOpacity
      style={[styles.container, isDark && styles.containerDark]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ✨ Accent Line */}
      <View style={[styles.accentLine, { backgroundColor: getRoleColor() }]} />
      
      {/* 🎯 Content */}
      <View style={styles.content}>
        {/* Avatar Container */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: `${getRoleColor()}15` }]}>
            <Text style={[styles.avatarText, { color: getRoleColor() }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.avatarGlow, { backgroundColor: `${getRoleColor()}08` }]} />
        </View>
        
        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.nameText, isDark && styles.nameTextDark]}>
            {name}
          </Text>
          <View style={styles.detailsRow}>
            <Ionicons name={getRoleIcon()} size={14} color={getRoleColor()} />
            <Text style={[styles.roleText, isDark && styles.roleTextDark, { color: getRoleColor() }]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
            <Text style={[styles.phoneText, isDark && styles.phoneTextDark]}>
              • {phone}
            </Text>
          </View>
        </View>
        
        {/* Action Icon */}
        <View style={[styles.actionContainer, { backgroundColor: `${getRoleColor()}15` }]}>
          <Ionicons name="chevron-forward" size={16} color={getRoleColor()} />
        </View>
      </View>
      
      {/* ✨ Hover Effect */}
      <View style={styles.hoverEffect} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0.2,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  nameTextDark: {
    color: 'white',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  roleTextDark: {
    opacity: 0.9,
  },
  phoneText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 4,
  },
  phoneTextDark: {
    color: '#94a3b8',
  },
  actionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hoverEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
});
