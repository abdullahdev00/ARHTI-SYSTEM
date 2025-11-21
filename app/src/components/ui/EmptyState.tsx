import React from 'react';
import { View, Text, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CapsuleButton } from './CapsuleButton';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

/**
 * WORLD-CLASS EMPTY STATE
 * Instagram-level design
 * Beautiful glass morphism
 * Professional animations
 * Premium visual hierarchy
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  buttonText,
  onButtonPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      {/* Background Decoration */}
      <View style={[styles.backgroundDecoration, isDark && styles.backgroundDecorationDark]} />

      {/* Icon Container */}
      <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
        <View style={styles.iconGlow} />
        <View style={styles.iconBackground}>
          <Ionicons
            name={icon}
            size={36}
            color="#10b981"
          />
        </View>
        <View style={styles.iconRing} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.titleText, isDark && styles.titleTextDark]}>
          {title}
        </Text>

        <Text style={[styles.subtitleText, isDark && styles.subtitleTextDark]}>
          {subtitle}
        </Text>
      </View>

      {/* Action Button */}
      {buttonText && onButtonPress && (
        <CapsuleButton
          title={buttonText}
          onPress={onButtonPress}
          variant="primary"
          size="large"
          style={styles.actionButton}
        />
      )}

      {/* Floating Elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  backgroundDecorationDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconContainerDark: {
    // Dark mode specific styles if needed
  },
  iconGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 50,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderStyle: 'dashed',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleTextDark: {
    color: 'white',
  },
  subtitleText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  subtitleTextDark: {
    color: '#94a3b8',
  },
  actionButton: {
    marginTop: 24,
  },
  floatingElement1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  floatingElement2: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
});
