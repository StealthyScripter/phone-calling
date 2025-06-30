import { Config } from '../../constants/Config';

export const validateEmail = (email: string): boolean => {
  const emailRegex = Config.validation.emailRegex;
  return emailRegex.test(email);
};

export const validatePhone = (phoneNumber: string): boolean => {
  const phoneRegex = Config.validation.phoneNumberRegex;
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleaned);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minLength = Config.validation.minPasswordLength;
  const maxLength = Config.validation.maxPasswordLength;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    errors.push(`Password must not exceed ${maxLength} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minLength = Config.validation.minUsernameLength;
  const maxLength = Config.validation.maxUsernameLength;

  if (username.length < minLength) {
    errors.push(`Username must be at least ${minLength} characters long`);
  }

  if (username.length > maxLength) {
    errors.push(`Username must not exceed ${maxLength} characters`);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  if (/^[0-9]/.test(username)) {
    errors.push('Username cannot start with a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
