import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';
import { Text } from './Text';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
}

/** Labelled text input with an optional show/hide toggle for passwords. */
export const Field = forwardRef<TextInput, Props>(function Field({ label, error, hint, secure, style, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 6 }}>
      <Text weight="semibold" style={{ fontSize: 13, color: colors.label, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.white,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[{ flex: 1, minHeight: 50, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 12 }, style]}
          {...rest}
        />
        {secure && (
          <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{hint}</Text>
      ) : null}
    </View>
  );
});
