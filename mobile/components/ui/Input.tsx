import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({ label, error, rightIcon, isPassword, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.iconBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && <View style={styles.iconBtn}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 14,
  },
  inputNormal: { borderColor: Colors.border },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.text,
  },
  iconBtn: { paddingLeft: 8 },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
