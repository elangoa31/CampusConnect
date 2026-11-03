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

export const validateStaffProfileForm = (
  data: {
    fullName?: string;
    department?: string;
    employeeId?: string;
    designation?: string;
    email?: string;
  }
): AuthValidationErrors => {
  const errors: AuthValidationErrors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (min 2 characters)';
  }

  if (!data.department || data.department.trim() === '') {
    errors.department = 'Department is required';
  }

  const trimmedId = (data.employeeId || '').trim();
  if (!trimmedId) {
    errors.employeeId = 'Employee ID is required';
  } else if (trimmedId.includes('@') || (data.email && trimmedId.toLowerCase() === data.email.toLowerCase())) {
    errors.employeeId = 'Employee ID cannot be an email address';
  } else if (trimmedId.toLowerCase() === 'jane') {
    errors.employeeId = 'Please enter your real college employee ID';
  }

  if (!data.designation || data.designation.trim() === '') {
    errors.designation = 'Designation is required';
  }

  return errors;
};

export const validateTimetableEntryForm = (
  data: {
    day_of_week?: string;
    start_time?: string;
    end_time?: string;
    subject?: string;
    classroom?: string;
    department?: string;
  }
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.subject || data.subject.trim().length < 2) {
    errors.subject = 'Subject name is required';
  }

  if (!data.classroom || data.classroom.trim() === '') {
    errors.classroom = 'Classroom or Lab location is required';
  }

  if (!data.department || data.department.trim() === '') {
    errors.department = 'Department is required';
  }

  if (!data.start_time) {
    errors.start_time = 'Start time is required';
  }

  if (!data.end_time) {
    errors.end_time = 'End time is required';
  }

  if (data.start_time && data.end_time && data.start_time >= data.end_time) {
    errors.end_time = 'End time must be after start time';
  }

  return errors;
};

export const validateMeetingRequestForm = (data: {
  requested_date?: string;
  requested_time?: string;
  meeting_type?: string;
  purpose?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.requested_date || data.requested_date.trim() === '') {
    errors.requested_date = 'Preferred date is required';
  } else {
    const parts = data.requested_date.trim().split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const reqDate = new Date(year, month, day);

      if (isNaN(reqDate.getTime())) {
        errors.requested_date = 'Please enter a valid date';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (reqDate < today) {
          errors.requested_date = 'Meeting date cannot be in the past';
        }
      }
    } else {
      errors.requested_date = 'Please enter a valid date (YYYY-MM-DD)';
    }
  }

  if (!data.requested_time || data.requested_time.trim() === '') {
    errors.requested_time = 'Preferred time is required';
  }

  if (!data.meeting_type || !['IN_PERSON', 'ONLINE'].includes(data.meeting_type)) {
    errors.meeting_type = 'Please select a meeting type (In Person or Online)';
  }

  if (!data.purpose || data.purpose.trim().length < 5) {
    errors.purpose = 'Please describe the meeting purpose (at least 5 characters)';
  } else if (data.purpose.trim().length > 500) {
    errors.purpose = 'Purpose must not exceed 500 characters';
  }

  return errors;
};


