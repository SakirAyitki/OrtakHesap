import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';

interface InputProps extends TextInputProps {
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        style
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon as any} 
            size={20} 
            color={COLORS.PRIMARY}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons 
              name={rightIcon as any} 
              size={20} 
              color="#888" 
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    paddingVertical: 8,
  },
  inputError: {
    borderBottomColor: COLORS.NEGATIVE,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
