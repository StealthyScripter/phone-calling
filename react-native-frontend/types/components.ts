export interface BaseComponentProps {
  className?: string;
  style?: any;
  testID?: string;
}

// Button component types
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Input component types
export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone' | 'number';
  autoComplete?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Modal component types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  backdrop?: 'static' | 'blur' | 'transparent';
  children: React.ReactNode;
}

// List component types
export interface ListItemProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
}

// Avatar component types
export interface AvatarProps extends BaseComponentProps {
  name?: string;
  source?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
  onPress?: () => void;
}

// Badge component types
export interface BadgeProps extends BaseComponentProps {
  text: string | number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  dot?: boolean;
}

// Card component types
export interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

// Navigation types
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// Form component types
export interface FormProps extends BaseComponentProps {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  validationSchema?: any;
  initialValues?: Record<string, any>;
}

export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

// Search component types
export interface SearchProps extends BaseComponentProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  showClearButton?: boolean;
  debounceMs?: number;
}
