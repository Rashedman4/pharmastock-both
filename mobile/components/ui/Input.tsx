import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { useRTL } from '@/lib/rtl';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({ label, error, rightIcon, isPassword, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);
  const { isRTL } = useRTL();

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={[styles.iconBtn, isRTL && styles.iconBtnRTL]}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && <View style={[styles.iconBtn, isRTL && styles.iconBtnRTL]}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: c.inputBackground,
    paddingHorizontal: 14,
  },
  inputNormal: { borderColor: c.border },
  inputError: { borderColor: c.error },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: c.text,
  },
  iconBtn: { paddingLeft: 8 },
  iconBtnRTL: { paddingLeft: 0, paddingRight: 8 },
  errorText: {
    color: c.error,
    fontSize: 12,
    marginTop: 4,
  },
});
