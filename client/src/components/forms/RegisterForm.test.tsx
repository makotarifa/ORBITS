import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from './RegisterForm';
import '../../i18n'; // Load and configure i18n for tests

// Mock the hook
const mockUseRegisterForm = vi.fn();
vi.mock('../../hooks/useRegisterForm', () => ({
  useRegisterForm: () => mockUseRegisterForm(),
}));

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRegisterForm.mockReturnValue({
      form: {
        register: vi.fn(),
        handleSubmit: vi.fn((fn) => fn),
        formState: { isValid: true },
      },
      isLoading: false,
      errors: {},
      onSubmit: vi.fn(),
    });
  });

  it('renders the registration form correctly', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    mockUseRegisterForm.mockReturnValue({
      form: {
        register: vi.fn(),
        handleSubmit: vi.fn((fn) => fn),
        formState: { isValid: true },
      },
      isLoading: true,
      errors: {},
      onSubmit: vi.fn(),
    });

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
  });

  it('displays form errors', () => {
    mockUseRegisterForm.mockReturnValue({
      form: {
        register: vi.fn(),
        handleSubmit: vi.fn((fn) => fn),
        formState: { isValid: false },
      },
      isLoading: false,
      errors: {
        email: { message: 'Invalid email format' },
        general: { message: 'General error' },
      },
      onSubmit: vi.fn(),
    });

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByText('General error')).toBeInTheDocument();
  });

  it('calls onSuccess when form is submitted successfully', () => {
    const mockOnSubmit = vi.fn().mockImplementation(async () => {
      mockOnSuccess();
    });

    mockUseRegisterForm.mockReturnValue({
      form: {
        register: vi.fn(),
        handleSubmit: vi.fn((fn) => () => {
          fn({ email: 'test@example.com', username: 'testuser', password: 'password123' });
        }),
        formState: { isValid: true },
      },
      isLoading: false,
      errors: {},
      onSubmit: mockOnSubmit,
    });

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // Simulate form submission
    const form = submitButton.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('shows switch to login link when onSwitchToLogin is provided', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);

    const loginLink = screen.getByText('Sign In');
    expect(loginLink).toBeInTheDocument();

    // Simulate click without userEvent
    loginLink.click();
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});