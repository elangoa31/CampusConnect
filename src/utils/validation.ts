import type {
  AuthValidationErrors,
  ForgotPasswordFormData,
  LoginFormData,
  PasswordStrength,
  SignupFormData,
  StudentProfileFormData,
  UserProfile,
} from '../types/auth.types';

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'College email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const getPasswordStrength = (password: string): PasswordStrength => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  let feedback = 'Very Weak';
  if (score === 1) feedback = 'Weak';
  else if (score === 2) feedback = 'Fair';
  else if (score === 3) feedback = 'Good';
  else if (score === 4) feedback = 'Strong';

  return {
    score,
    feedback,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
};

export const validateLoginForm = (data: LoginFormData): AuthValidationErrors => {
  const errors: AuthValidationErrors = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateSignupForm = (data: SignupFormData): AuthValidationErrors => {
  const errors: AuthValidationErrors = {};

  // Full name
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (min 2 characters)';
  }

  // Email
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  // Department
  if (!data.department || data.department.trim() === '') {
    errors.department = 'Department is required';
  }

  // Role-specific validation
  if (data.role === 'student') {
    if (!data.registerNumber || data.registerNumber.trim() === '') {
      errors.registerNumber = 'Register number is required for students';
    }
    if (!data.yearOfStudy || data.yearOfStudy.trim() === '') {
      errors.yearOfStudy = 'Year of study is required';
    }
  } else if (data.role === 'staff') {
    if (!data.employeeId || data.employeeId.trim() === '') {
      errors.employeeId = 'Employee ID is required for staff';
    }
    if (!data.designation || data.designation.trim() === '') {
      errors.designation = 'Designation is required for staff';
    }
  } else {
    errors.role = 'Invalid role selected. Only Student and Staff are allowed.';
  }

  // Password
  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  // Confirm password
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const validateForgotPasswordForm = (
  data: ForgotPasswordFormData
): AuthValidationErrors => {
  const errors: AuthValidationErrors = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  return errors;
};

export const isStudentProfileComplete = (
  profile?: Partial<UserProfile> | null
): boolean => {
  if (!profile) return false;

  const dept = profile.department?.trim();
  const reg = profile.register_number?.trim();
  const year = profile.year_of_study?.trim();

  const isDeptValid = Boolean(
    dept && dept !== '' && dept !== 'General' && dept !== 'Not specified' && dept !== 'N/A'
  );
  const isRegValid = Boolean(reg && reg !== '' && reg !== 'N/A');
  const isYearValid = Boolean(year && year !== '' && year !== 'N/A');

  return isDeptValid && isRegValid && isYearValid;
};

export const validateStudentProfileForm = (
  data: Partial<StudentProfileFormData>
): AuthValidationErrors => {
  const errors: AuthValidationErrors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (min 2 characters)';
  }

  const emailError = validateEmail(data.email || '');
  if (emailError) {
    errors.email = emailError;
  }

  if (!data.department || data.department.trim() === '') {
    errors.department = 'Department is required';
  }

  if (!data.registerNumber || data.registerNumber.trim() === '') {
    errors.registerNumber = 'Register number is required';
  } else if (data.registerNumber.trim().length < 3) {
    errors.registerNumber = 'Please enter a valid register number';
  }

  const allowedYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate',
  ];
  if (!data.yearOfStudy || !allowedYears.includes(data.yearOfStudy)) {
    errors.yearOfStudy = 'Please select a valid year of study';
  }

  return errors;
};
