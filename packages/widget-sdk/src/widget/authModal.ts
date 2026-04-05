/**
 * Authentication Modal
 * 
 * Provides login/register UI for tester authentication within the widget.
 */

import { login, register, setAuthToken, setTesterInfo, getTesterInfo } from '../utils/apiClient';

let authModal: HTMLElement | null = null;
let isOpen = false;
let onSuccessCallback: (() => void) | null = null;

export function getAuthModal(): HTMLElement | null {
  return authModal;
}

export function isAuthModalOpen(): boolean {
  return isOpen;
}

/**
 * Initialize the authentication modal
 */
export function initAuthModal(apiBaseUrl: string): void {
  if (authModal) return; // Already initialized

  authModal = document.createElement('div');
  authModal.id = '__bugreport-auth-modal__';
  authModal.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2147483646;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  authModal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      width: 400px;
      max-width: 90%;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    ">
      <button id="__bugreport-auth-close__" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        line-height: 1;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>

      <div id="__bugreport-auth-content__">
        <!-- Login form (default) -->
        <div id="__bugreport-auth-login__">
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111827;">Sign In</h2>
          <p style="margin: 0 0 1.5rem 0; font-size: 0.875rem; color: #6b7280;">
            Sign in to your tester account to submit bug reports.
          </p>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              Email
            </label>
            <input id="__bugreport-auth-login-email__" type="email" placeholder="your@email.com" style="
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            " />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              Password
            </label>
            <input id="__bugreport-auth-login-password__" type="password" placeholder="••••••••" style="
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            " />
          </div>

          <div id="__bugreport-auth-login-error__" style="
            display: none;
            padding: 0.75rem;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          "></div>

          <button id="__bugreport-auth-login-submit__" style="
            width: 100%;
            padding: 0.625rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          ">Sign In</button>

          <p style="margin-top: 1rem; text-align: center; font-size: 0.875rem; color: #6b7280;">
            Don't have an account? 
            <a href="#" id="__bugreport-auth-show-register__" style="color: #2563eb; text-decoration: none;">Register</a>
          </p>
        </div>

        <!-- Register form -->
        <div id="__bugreport-auth-register__" style="display: none;">
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111827;">Create Account</h2>
          <p style="margin: 0 0 1.5rem 0; font-size: 0.875rem; color: #6b7280;">
            Register to start submitting bug reports.
          </p>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              Name
            </label>
            <input id="__bugreport-auth-register-name__" type="text" placeholder="John Doe" style="
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            " />
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              Email
            </label>
            <input id="__bugreport-auth-register-email__" type="email" placeholder="your@email.com" style="
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            " />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
              Password
            </label>
            <input id="__bugreport-auth-register-password__" type="password" placeholder="Minimum 8 characters" style="
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              font-size: 0.875rem;
            " />
          </div>

          <div id="__bugreport-auth-register-error__" style="
            display: none;
            padding: 0.75rem;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          "></div>

          <button id="__bugreport-auth-register-submit__" style="
            width: 100%;
            padding: 0.625rem;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          ">Create Account</button>

          <p style="margin-top: 1rem; text-align: center; font-size: 0.875rem; color: #6b7280;">
            Already have an account? 
            <a href="#" id="__bugreport-auth-show-login__" style="color: #2563eb; text-decoration: none;">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(authModal);

  // Event listeners
  setupAuthEventListeners(apiBaseUrl);
}

function setupAuthEventListeners(apiBaseUrl: string): void {
  if (!authModal) return;

  // Close button
  const closeBtn = authModal.querySelector('#__bugreport-auth-close__');
  closeBtn?.addEventListener('click', closeAuthModal);

  // Close on backdrop click
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      closeAuthModal();
    }
  });

  // Toggle between login and register
  const showRegisterBtn = authModal.querySelector('#__bugreport-auth-show-register__');
  const showLoginBtn = authModal.querySelector('#__bugreport-auth-show-login__');

  showRegisterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  showLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });

  // Login form submission
  const loginSubmit = authModal.querySelector('#__bugreport-auth-login-submit__');
  const loginEmail = authModal.querySelector('#__bugreport-auth-login-email__') as HTMLInputElement;
  const loginPassword = authModal.querySelector('#__bugreport-auth-login-password__') as HTMLInputElement;

  loginSubmit?.addEventListener('click', async () => {
    await handleLogin(apiBaseUrl, loginEmail.value, loginPassword.value);
  });

  loginEmail?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginSubmit?.dispatchEvent(new Event('click'));
  });

  loginPassword?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginSubmit?.dispatchEvent(new Event('click'));
  });

  // Register form submission
  const registerSubmit = authModal.querySelector('#__bugreport-auth-register-submit__');
  const registerName = authModal.querySelector('#__bugreport-auth-register-name__') as HTMLInputElement;
  const registerEmail = authModal.querySelector('#__bugreport-auth-register-email__') as HTMLInputElement;
  const registerPassword = authModal.querySelector('#__bugreport-auth-register-password__') as HTMLInputElement;

  registerSubmit?.addEventListener('click', async () => {
    await handleRegister(apiBaseUrl, registerName.value, registerEmail.value, registerPassword.value);
  });

  registerName?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerSubmit?.dispatchEvent(new Event('click'));
  });

  registerEmail?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerSubmit?.dispatchEvent(new Event('click'));
  });

  registerPassword?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerSubmit?.dispatchEvent(new Event('click'));
  });
}

function showLoginForm(): void {
  if (!authModal) return;
  
  const loginForm = authModal.querySelector('#__bugreport-auth-login__') as HTMLElement;
  const registerForm = authModal.querySelector('#__bugreport-auth-register__') as HTMLElement;
  
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  
  clearErrors();
}

function showRegisterForm(): void {
  if (!authModal) return;
  
  const loginForm = authModal.querySelector('#__bugreport-auth-login__') as HTMLElement;
  const registerForm = authModal.querySelector('#__bugreport-auth-register__') as HTMLElement;
  
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  
  clearErrors();
}

function clearErrors(): void {
  if (!authModal) return;
  
  const loginError = authModal.querySelector('#__bugreport-auth-login-error__') as HTMLElement;
  const registerError = authModal.querySelector('#__bugreport-auth-register-error__') as HTMLElement;
  
  loginError.style.display = 'none';
  registerError.style.display = 'none';
  loginError.textContent = '';
  registerError.textContent = '';
}

function showLoginError(message: string): void {
  if (!authModal) return;
  
  const errorEl = authModal.querySelector('#__bugreport-auth-login-error__') as HTMLElement;
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function showRegisterError(message: string): void {
  if (!authModal) return;
  
  const errorEl = authModal.querySelector('#__bugreport-auth-register-error__') as HTMLElement;
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

async function handleLogin(apiBaseUrl: string, email: string, password: string): Promise<void> {
  clearErrors();

  if (!email || !password) {
    showLoginError('Please enter email and password');
    return;
  }

  try {
    const response = await login(apiBaseUrl, { email, password });

    if (!response.success) {
      showLoginError(response.error || 'Login failed');
      return;
    }

    // Store token and tester info
    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.tester) {
      setTesterInfo(response.tester);
    }

    // Close modal and trigger success callback
    closeAuthModal();
    if (onSuccessCallback) {
      onSuccessCallback();
    }
  } catch (err) {
    showLoginError('Network error. Please try again.');
  }
}

async function handleRegister(apiBaseUrl: string, name: string, email: string, password: string): Promise<void> {
  clearErrors();

  if (!name || !email || !password) {
    showRegisterError('All fields are required');
    return;
  }

  if (password.length < 8) {
    showRegisterError('Password must be at least 8 characters');
    return;
  }

  try {
    const response = await register(apiBaseUrl, { email, name, password });

    if (!response.success) {
      showRegisterError(response.error || 'Registration failed');
      return;
    }

    // Store token and tester info
    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.tester) {
      setTesterInfo(response.tester);
    }

    // Close modal and trigger success callback
    closeAuthModal();
    if (onSuccessCallback) {
      onSuccessCallback();
    }
  } catch (err) {
    showRegisterError('Network error. Please try again.');
  }
}

/**
 * Open the authentication modal
 */
export function openAuthModal(onSuccess?: () => void): void {
  if (!authModal) {
    console.error('Auth modal not initialized');
    return;
  }

  onSuccessCallback = onSuccess || null;
  authModal.style.display = 'flex';
  isOpen = true;
  showLoginForm();
  clearErrors();
}

/**
 * Close the authentication modal
 */
export function closeAuthModal(): void {
  if (!authModal) return;
  
  authModal.style.display = 'none';
  isOpen = false;
  onSuccessCallback = null;
  clearErrors();
}

/**
 * Destroy the authentication modal
 */
export function destroyAuthModal(): void {
  if (authModal) {
    authModal.remove();
    authModal = null;
    isOpen = false;
    onSuccessCallback = null;
  }
}
