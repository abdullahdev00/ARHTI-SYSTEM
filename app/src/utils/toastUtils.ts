/**
 * Toast Utility
 * Android: ToastAndroid (native toast)
 * iOS: Alert fallback
 */

import { ToastAndroid, Platform, Alert } from 'react-native'
import Toast from 'react-native-toast-message'

export const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
) => {
    if (Platform.OS === 'android') {
        // Android: Use native ToastAndroid
        ToastAndroid.show(message, ToastAndroid.SHORT)
    } else {
        // iOS: Use Alert as fallback
        Alert.alert('', message, [{ text: 'OK' }])
    }
}

export const showSuccessToast = (message: string) => {
    showToast(`✅ ${message}`, 'success')
}

export const showErrorToast = (message: string) => {
    showToast(`❌ ${message}`, 'error')
}

export const showInfoToast = (message: string) => {
    showToast(`ℹ️ ${message}`, 'info')
}
