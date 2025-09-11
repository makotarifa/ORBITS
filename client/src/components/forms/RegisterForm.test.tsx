import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from './RegisterForm';
import '../../i18n'; // Initialize i18n for tests

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

  it('calls onSuccess when form is submitted successfully', async () => {
    const user = userEvent.setup();
    const mockHandleSubmit = vi.fn((fn) => async (data: any) => {
      await fn(data);
      mockOnSuccess(); // Call onSuccess in the mock
    });

    mockUseRegisterForm.mockReturnValue({
      form: {
        register: vi.fn(),
        handleSubmit: mockHandleSubmit,
        formState: { isValid: true },
      },
      isLoading: false,
      errors: {},
      onSubmit: mockHandleSubmit(vi.fn()),
    });

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows switch to login link when onSwitchToLogin is provided', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);

    const loginLink = screen.getByText('Sign In');
    expect(loginLink).toBeInTheDocument();

    await user.click(loginLink);
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});