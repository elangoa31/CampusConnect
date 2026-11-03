export type UserRole = 'student' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  // Student-specific fields
  register_number?: string | null;
  year_of_study?: string | null;
  // Staff-specific fields
  employee_id?: string | null;
  designation?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  // Student fields
  registerNumber?: string;
  yearOfStudy?: string;
  // Staff fields
  employeeId?: string;
  designation?: string;
  // Password
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface AuthValidationErrors {
  [key: string]: string | undefined;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  feedback: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
