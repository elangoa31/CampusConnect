import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  getPasswordStrength,
  validateLoginForm,
  validateSignupForm,
  validateForgotPasswordForm,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('returns error for empty email', () => {
      expect(validateEmail('')).toBe('College email is required');
      expect(validateEmail('   ')).toBe('College email is required');
    });

    it('returns error for invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe('Please enter a valid email address');
      expect(validateEmail('user@')).toBe('Please enter a valid email address');
      expect(validateEmail('user@college')).toBe('Please enter a valid email address');
    });

    it('returns null for valid college email', () => {
      expect(validateEmail('student@college.edu')).toBeNull();
      expect(validateEmail('faculty@university.ac.in')).toBeNull();
      expect(validateEmail('john.doe@mit.edu')).toBeNull();
    });
  });

  describe('getPasswordStrength', () => {
    it('rates very weak passwords properly', () => {
      const result = getPasswordStrength('123');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.hasMinLength).toBe(false);
    });

    it('rates strong passwords with full score', () => {
      const result = getPasswordStrength('Campus@2026!Strong');
      expect(result.score).toBe(4);
      expect(result.feedback).toBe('Strong');
      expect(result.hasMinLength).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecialChar).toBe(true);
    });
  });

  describe('validateLoginForm', () => {
    it('detects missing email and password', () => {
      const errors = validateLoginForm({
        email: '',
        password: '',
        rememberMe: false,
      });
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('passes with valid inputs', () => {
      const errors = validateLoginForm({
        email: 'prof@college.edu',
        password: 'Password123!',
        rememberMe: true,
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('validateSignupForm', () => {
    it('validates student specific fields', () => {
      const errors = validateSignupForm({
        fullName: 'Alex Smith',
        email: 'alex@college.edu',
        role: 'student',
        department: 'Computer Science',
        registerNumber: '', // missing
        yearOfStudy: '', // missing
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(errors.registerNumber).toBe('Register number is required for students');
      expect(errors.yearOfStudy).toBe('Year of study is required');
      expect(errors.employeeId).toBeUndefined();
    });

    it('validates staff specific fields', () => {
      const errors = validateSignupForm({
        fullName: 'Dr. Jane Doe',
        email: 'jane@college.edu',
        role: 'staff',
        department: 'Electronics',
        employeeId: '', // missing
        designation: '', // missing
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(errors.employeeId).toBe('Employee ID is required for staff');
      expect(errors.designation).toBe('Designation is required for staff');
      expect(errors.verificationCode).toBe('Faculty verification code is required for staff registration');
      expect(errors.registerNumber).toBeUndefined();
    });

    it('rejects invalid staff verification code', () => {
      const errors = validateSignupForm({
        fullName: 'Dr. Jane Doe',
        email: 'jane@college.edu',
        role: 'staff',
        department: 'Electronics',
        employeeId: 'EMP100',
        designation: 'Professor',
        verificationCode: 'WRONG_CODE_999',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(errors.verificationCode).toBe('Invalid faculty verification code. Contact college administration.');
    });

    it('accepts valid staff verification code', () => {
      const errors = validateSignupForm({
        fullName: 'Dr. Jane Doe',
        email: 'jane@college.edu',
        role: 'staff',
        department: 'Electronics',
        employeeId: 'EMP100',
        designation: 'Professor',
        verificationCode: 'FACULTY2026',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(errors.verificationCode).toBeUndefined();
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects password mismatch', () => {
      const errors = validateSignupForm({
        fullName: 'Alex Smith',
        email: 'alex@college.edu',
        role: 'student',
        department: 'Computer Science',
        registerNumber: 'CS1020',
        yearOfStudy: '3rd Year',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword456!',
      });

      expect(errors.confirmPassword).toBe('Passwords do not match');
    });

    it('passes for complete valid student signup', () => {
      const errors = validateSignupForm({
        fullName: 'Alex Smith',
        email: 'alex@college.edu',
        role: 'student',
        department: 'Computer Science',
        registerNumber: 'CS1020',
        yearOfStudy: '3rd Year',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('validateForgotPasswordForm', () => {
    it('validates college email', () => {
      expect(validateForgotPasswordForm({ email: '' }).email).toBeDefined();
      expect(validateForgotPasswordForm({ email: 'valid@college.edu' }).email).toBeUndefined();
    });
  });
});
