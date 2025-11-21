import React from 'react';
import { View, Text, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'emerald' | 'orange' | 'red' | 'blue';
}

/**
 * 🎨 WORLD-CLASS STATUS CARD
 * ✅ Modern glass morphism design
 * ✅ Beautiful color indicators
 * ✅ Professional animations
 * ✅ Premium feel
 */
export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  icon,
  color,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getIconColor = () => {
    switch (color) {
      case 'emerald':
        return '#10b981';
      case 'orange':
        return '#f59e0b';
      case 'red':
        return '#ef4444';
      case 'blue':
        return '#3b82f6';
      default:
        return '#10b981';
    }
  };

  const getAccentColor = () => {
    switch (color) {
      case 'emerald':
        return 'rgba(16, 185, 129, 0.1)';
      case 'orange':
        return 'rgba(245, 158, 11, 0.1)';
      case 'red':
        return 'rgba(239, 68, 68, 0.1)';
      case 'blue':
        return 'rgba(59, 130, 246, 0.1)';
      default:
        return 'rgba(16, 185, 129, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case 'emerald':
        return 'rgba(16, 185, 129, 0.2)';
      case 'orange':
        return 'rgba(245, 158, 11, 0.2)';
      case 'red':
        return 'rgba(239, 68, 68, 0.2)';
      case 'blue':
        return 'rgba(59, 130, 246, 0.2)';
      default:
        return 'rgba(16, 185, 129, 0.2)';
    }
  };

  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : styles.containerLight,
      { borderColor: getBorderColor() }
    ]}>
      {/* ✨ Accent Background */}
      <View style={[styles.accentBackground, { backgroundColor: getAccentColor() }]} />
      
      {/* 🎯 Header with Icon */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getAccentColor() }]}>
          <Ionicons name={icon} size={22} color={getIconColor()} />
        </View>
        <View style={[styles.statusDot, { backgroundColor: getIconColor() }]} />
      </View>
      
      {/* 📊 Value */}
      <Text style={[styles.valueText, isDark && styles.valueTextDark]}>
        {value.toLocaleString()}
      </Text>
      
      {/* 📝 Label */}
      <Text style={[styles.labelText, isDark && styles.labelTextDark]}>
        {label}
      </Text>
      
      {/* ✨ Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: getIconColor() }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  containerDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accentBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  valueTextDark: {
    color: 'white',
  },
  labelText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelTextDark: {
    color: '#94a3b8',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  progressBar: {
    height: '100%',
    width: '70%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
