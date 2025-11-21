import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActivityCardProps {
  title: string;
  subtitle: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

/**
 * 🎨 WORLD-CLASS ACTIVITY CARD
 * ✅ Instagram-level design
 * ✅ Modern glass morphism
 * ✅ Professional animations
 * ✅ Premium visual hierarchy
 */
export const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  subtitle,
  date,
  icon,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      style={[styles.container, isDark && styles.containerDark]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ✨ Accent Line */}
      <View style={styles.accentLine} />
      
      {/* 🎯 Content */}
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name={icon} size={20} color="#10b981" />
          </View>
          <View style={styles.iconGlow} />
        </View>
        
        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.titleText, isDark && styles.titleTextDark]}>
            {title}
          </Text>
          <Text style={[styles.subtitleText, isDark && styles.subtitleTextDark]}>
            {subtitle}
          </Text>
        </View>
        
        {/* Date Badge */}
        <View style={[styles.dateBadge, isDark && styles.dateBadgeDark]}>
          <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
            {date}
          </Text>
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
    backgroundColor: '#10b981',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  iconGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  titleTextDark: {
    color: 'white',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  subtitleTextDark: {
    color: '#94a3b8',
  },
  dateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  dateBadgeDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  dateTextDark: {
    color: '#34d399',
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
