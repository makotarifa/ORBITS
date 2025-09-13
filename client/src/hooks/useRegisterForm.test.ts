import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRegisterForm } from './useRegisterForm';
import { authService } from '../services/auth/auth.service';

// Hoisted mock functions
const mockHandleSubmit = vi.hoisted(() => vi.fn());
const mockReset = vi.hoisted(() => vi.fn());
const mockSetError = vi.hoisted(() => vi.fn());
const mockClearErrors = vi.hoisted(() => vi.fn());
const mockWatch = vi.hoisted(() => vi.fn());
const mockGetValues = vi.hoisted(() => vi.fn());
const mockSetValue = vi.hoisted(() => vi.fn());
const mockTrigger = vi.hoisted(() => vi.fn());
const mockUseForm = vi.hoisted(() => vi.fn());

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: mockUseForm,
  useFormContext: vi.fn(),
}));

// Mock zodResolver
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

// Mock auth service
vi.mock('../services/auth/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock useAuthTranslations
vi.mock('./ui/useAuthTranslations', () => ({
  useAuthTranslations: vi.fn(() => ({
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      usernameMinLength: 'Username must be at least 3 characters',
      usernameMaxLength: 'Username must be at most 20 characters',
      usernamePattern: 'Username can only contain letters, numbers, and underscores',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordPattern: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      confirmPasswordRequired: 'Please confirm your password',
      passwordsNotMatch: 'Passwords do not match',
    },
    general: {
      unexpectedError: 'An unexpected error occurred',
    },
  })),
}));

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up form methods mock
    const mockFormMethods = {
      handleSubmit: mockHandleSubmit,
      reset: mockReset,
      setError: mockSetError,
      clearErrors: mockClearErrors,
      watch: mockWatch,
      getValues: mockGetValues,
      setValue: mockSetValue,
      trigger: mockTrigger,
      formState: {
        errors: {},
        isValid: true,
        isDirty: false,
        isSubmitting: false,
      },
    };

    mockUseForm.mockReturnValue(mockFormMethods);
    
    // Reset mock implementations - handleSubmit should return a function that calls the provided function with form data
    mockHandleSubmit.mockImplementation((onSubmitFn: any) => {
      return async () => {
        const formData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123',
        };
        return await onSubmitFn(formData);
      };
    });
    
    // Mock successful auth service response by default
    vi.mocked(authService.register).mockResolvedValue({
      success: true,
      data: {
        access_token: 'mock-token',
        user: { 
          id: 'user-123', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        },
      },
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.errors).toEqual({});
    expect(mockUseForm).toHaveBeenCalledWith({
      resolver: expect.any(Function),
      defaultValues: {
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      },
    });
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      success: true,
      data: {
        access_token: 'mock-token',
        user: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        },
      },
    };

    vi.mocked(authService.register).mockResolvedValue(mockResponse);

    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useRegisterForm(mockOnSuccess));

    let submitResult;
    await act(async () => {
      submitResult = await result.current.onSubmit();
    });

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-token');
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(submitResult).toEqual({
      success: true,
      user: mockResponse.data.user,
    });
  });

  it('should handle registration failure with field errors', async () => {
    const mockResponse = {
      success: false,
      errors: {
        email: ['Email already exists'],
        username: ['Username is taken'],
      },
    };

    vi.mocked(authService.register).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRegisterForm());

    let submitResult;
    await act(async () => {
      submitResult = await result.current.onSubmit();
    });

    expect(result.current.errors).toEqual({
      email: { message: 'Email already exists' },
      username: { message: 'Username is taken' },
    });

    expect(submitResult).toEqual({
      success: false,
      errors: {
        email: { message: 'Email already exists' },
        username: { message: 'Username is taken' },
      },
    });
  });

  it('should handle network error', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRegisterForm());

    let submitResult;
    await act(async () => {
      submitResult = await result.current.onSubmit();
    });

    expect(result.current.errors).toEqual({
      general: { message: 'An unexpected error occurred' },
    });

    expect(submitResult).toEqual({
      success: false,
      errors: {
        general: { message: 'An unexpected error occurred' },
      },
    });
  });

  it('should set loading state during submission', async () => {
    // Create a promise we can control
    let resolveAuthService: any;
    const controlledPromise = new Promise((resolve) => {
      resolveAuthService = resolve;
    });

    vi.mocked(authService.register).mockReturnValue(controlledPromise as any);

    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.isLoading).toBe(false);

    // Start the submission but don't await immediately
    let submitPromise: any;
    act(() => {
      submitPromise = result.current.onSubmit();
    });

    // The loading state should now be true
    expect(result.current.isLoading).toBe(true);

    // Resolve the auth service promise
    resolveAuthService({
      success: true,
      data: { 
        access_token: 'token', 
        user: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        } 
      },
    });

    // Now await the completion
    await act(async () => {
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should clear errors before submission', async () => {
    // First test with failed submission to set an error
    vi.mocked(authService.register).mockRejectedValueOnce(new Error('Test error'));
    
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.onSubmit();
    });

    // Verify error was set
    expect(result.current.errors).toEqual({
      general: { message: 'An unexpected error occurred' },
    });

    // Now test successful submission in a new hook instance
    vi.mocked(authService.register).mockResolvedValue({
      success: true,
      data: {
        access_token: 'mock-token',
        user: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        },
      },
    });

    const { result: result2 } = renderHook(() => useRegisterForm());

    // Manually set an error first to test clearing
    await act(async () => {
      // Trigger an error first
      vi.mocked(authService.register).mockRejectedValueOnce(new Error('Test'));
      await result2.current.onSubmit();
    });

    expect(result2.current.errors).toEqual({
      general: { message: 'An unexpected error occurred' },
    });

    // Now test successful submission clears errors
    vi.mocked(authService.register).mockResolvedValue({
      success: true,
      data: { 
        access_token: 'token', 
        user: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        } 
      },
    });

    await act(async () => {
      await result2.current.onSubmit();
    });

    expect(result2.current.errors).toEqual({});
  });

  it('should handle registration without access token', async () => {
    const mockResponse = {
      success: true,
      data: {
        access_token: undefined,
        user: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser',
          level: 1,
          experience: 0,
          isActive: true,
          createdAt: new Date()
        },
      },
    } as any;

    vi.mocked(authService.register).mockResolvedValue(mockResponse);

    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useRegisterForm(mockOnSuccess));

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});