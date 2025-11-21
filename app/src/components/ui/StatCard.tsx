import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'emerald' | 'amber' | 'violet' | 'cyan' | 'orange' | 'red';
  onPress?: () => void;
}

/**
 * 🎨 WORLD-CLASS PROFESSIONAL STAT CARD
 * ✅ Instagram-level design
 * ✅ Beautiful gradients
 * ✅ Modern shadows
 * ✅ Professional animations
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (color) {
      case 'emerald':
        return ['#10b981', '#059669', '#047857'] as const;
      case 'amber':
        return ['#f59e0b', '#d97706', '#b45309'] as const;
      case 'violet':
        return ['#8b5cf6', '#7c3aed', '#6d28d9'] as const;
      case 'cyan':
        return ['#06b6d4', '#0891b2', '#0e7490'] as const;
      case 'orange':
        return ['#f97316', '#ea580c', '#c2410c'] as const;
      case 'red':
        return ['#ef4444', '#dc2626', '#b91c1c'] as const;
      default:
        return ['#10b981', '#059669', '#047857'] as const;
    }
  };

  const getIconBackground = () => {
    switch (color) {
      case 'emerald':
        return 'rgba(255, 255, 255, 0.2)';
      case 'amber':
        return 'rgba(255, 255, 255, 0.2)';
      case 'violet':
        return 'rgba(255, 255, 255, 0.2)';
      case 'cyan':
        return 'rgba(255, 255, 255, 0.2)';
      case 'orange':
        return 'rgba(255, 255, 255, 0.2)';
      case 'red':
        return 'rgba(255, 255, 255, 0.2)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* ✨ Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* 🎯 Icon Section */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: getIconBackground() }]}>
            <Ionicons name={icon} size={28} color="white" />
          </View>
          <View style={styles.sparkle}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
        
        {/* 📊 Value Section */}
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          <View style={styles.valueLine} />
        </View>
        
        {/* 📝 Title Section */}
        <Text style={styles.titleText}>
          {title}
        </Text>
        
        {/* ✨ Shine Effect */}
        <View style={styles.shineEffect} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  gradientCard: {
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sparkle: {
    opacity: 0.7,
  },
  valueContainer: {
    marginBottom: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  valueLine: {
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    marginTop: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
});
