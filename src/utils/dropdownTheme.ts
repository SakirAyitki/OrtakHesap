import DropDownPicker from 'react-native-dropdown-picker';
import { COLORS } from './color';

// Varsayılan stilleri ayarla
DropDownPicker.setListMode("SCROLLVIEW");

// Varsayılan temayı kullan
DropDownPicker.setTheme("LIGHT");

export const dropdownStyles = {
  style: {
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    minHeight: 45,
  },
  dropDownContainerStyle: {
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  textStyle: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  placeholderStyle: {
    color: COLORS.TEXT_GRAY,
  },
  arrowIconStyle: {
    width: 20,
    height: 20,
    tintColor: COLORS.TEXT_DARK,
  },
  tickIconStyle: {
    width: 20,
    height: 20,
    tintColor: COLORS.PRIMARY,
  },
}; 