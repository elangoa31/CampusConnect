import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { RoleSelector } from '../components/auth/RoleSelector';
import { PasswordInput } from '../components/auth/PasswordInput';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useState } from 'react';
import type { UserRole } from '../types/auth.types';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthProvider>
  );
};

describe('Authentication Components', () => {
  describe('RoleSelector', () => {
    const TestRoleWrapper = () => {
      const [role, setRole] = useState<UserRole>('student');
      return <RoleSelector selectedRole={role} onChange={setRole} />;
    };

    it('renders Student and Staff options with correct default active state', () => {
      render(<TestRoleWrapper />);
      const studentBtn = screen.getByRole('radio', { name: /student/i });
      const staffBtn = screen.getByRole('radio', { name: /staff/i });

      expect(studentBtn).toBeInTheDocument();
      expect(staffBtn).toBeInTheDocument();
      expect(studentBtn).toHaveAttribute('aria-checked', 'true');
      expect(staffBtn).toHaveAttribute('aria-checked', 'false');

      // Click Staff
      fireEvent.click(staffBtn);
      expect(staffBtn).toHaveAttribute('aria-checked', 'true');
      expect(studentBtn).toHaveAttribute('aria-checked', 'false');
    });

    it('does NOT offer an Admin role option', () => {
      render(<TestRoleWrapper />);
      expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    });
  });

  describe('PasswordInput', () => {
    it('toggles password visibility when eye icon is clicked', () => {
      render(<PasswordInput label="Password" placeholder="Enter password" />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('LoginForm', () => {
    it('renders all required elements: heading, inputs, remember me, buttons, signup link', () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByText(/welcome back! please enter your details\./i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your college email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('displays client-side validation errors when submitting empty form', async () => {
      renderWithProviders(<LoginForm />);
      const submitBtn = screen.getByRole('button', { name: /^sign in$/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/college email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });
  });

  describe('SignupForm', () => {
    it('renders role selector, common fields and student-specific fields by default', () => {
      renderWithProviders(<SignupForm />);

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/join your campus community\./i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Dr\. Jane Smith or Alex Johnson/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/yourname@college\.edu/i)).toBeInTheDocument();

      // Student conditional fields
      expect(screen.getByPlaceholderText(/e\.g\. 717821F101/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Year of study

      // Staff conditional fields should NOT be rendered yet
      expect(screen.queryByPlaceholderText(/e\.g\. EMP-2041/i)).not.toBeInTheDocument();
    });

    it('switches conditional fields when Staff is selected', () => {
      renderWithProviders(<SignupForm />);

      const staffRadio = screen.getByRole('radio', { name: /staff/i });
      fireEvent.click(staffRadio);

      // Staff conditional fields appear
      expect(screen.getByPlaceholderText(/e\.g\. EMP-2041/i)).toBeInTheDocument();
      expect(screen.getAllByText(/designation/i).length).toBeGreaterThanOrEqual(1);

      // Student register number disappears
      expect(screen.queryByPlaceholderText(/e\.g\. 717821F101/i)).not.toBeInTheDocument();
    });
  });

  describe('ForgotPasswordForm', () => {
    it('renders forgot password elements and back link', () => {
      renderWithProviders(<ForgotPasswordForm />);

      expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your college email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
    });
  });

  describe('AuthLayout', () => {
    it('displays brand title, logo, and promotional slogan', () => {
      renderWithProviders(
        <AuthLayout>
          <div>Child Form Content</div>
        </AuthLayout>
      );

      expect(screen.getByText('CAMPUSCONNECT')).toBeInTheDocument();
      expect(screen.getByText(/your campus\./i)).toBeInTheDocument();
      expect(screen.getByText(/connected\./i)).toBeInTheDocument();
      expect(screen.getByText(/find your faculty\. know their availability\. save your time\./i)).toBeInTheDocument();
      expect(screen.getByText(/your campus, within reach\./i)).toBeInTheDocument();
      expect(screen.getByText('Child Form Content')).toBeInTheDocument();
    });
  });
});
