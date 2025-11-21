import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'emerald' | 'amber' | 'violet' | 'cyan';
  onPress: () => void;
}

/**
 * 🎨 Professional Quick Action Card
 * ✅ Reusable action buttons
 * ✅ Dark mode compatible
 * ✅ Consistent styling
 * ✅ Touch feedback
 */
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getIconColor = () => {
    switch (color) {
      case 'emerald':
        return '#10b981';
      case 'amber':
        return '#f59e0b';
      case 'violet':
        return '#8b5cf6';
      case 'cyan':
        return '#06b6d4';
      default:
        return '#10b981';
    }
  };

  const getBackgroundClass = () => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'violet':
        return 'bg-violet-100 dark:bg-violet-900/30';
      case 'cyan':
        return 'bg-cyan-100 dark:bg-cyan-900/30';
      default:
        return 'bg-emerald-100 dark:bg-emerald-900/30';
    }
  };

  return (
    <TouchableOpacity
      className="w-1/2 px-2 mb-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
        <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${getBackgroundClass()}`}>
          <Ionicons name={icon} size={20} color={getIconColor()} />
        </View>
        
        <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </Text>
        <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
