import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


// Define the initial state for authentication
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isAuthLoading: true,
  error: null,
  registrationSuccess: false,

  // -- State for forget password
  isForgotPasswordLoading: false,
  forgotPasswordError: null,
  forgotPasswordSuccess: false,

  // ADDED STATE FOR RESET PASSWORD
  isResettingPassword: false,
  resetPasswordError: null,
  resetPasswordSuccess: false,
};


// Define an async thunk for handling the login API call
// createAsyncThunk automatically handles pending, fulfilled, and rejected states
export const loginUser = createAsyncThunk(

  'auth/loginUser', // Action type string (sliceName/actionName)

  async (credentials, { rejectWithValue }) => {

    try {
      const response = await axios.post('/api/auth/login', credentials);

      const { accessToken, user } = response.data;

      // Optionally, store the token in local storage for persistence across sessions
      // Be mindful of security implications when storing tokens in local storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { accessToken, user };

    } catch (error) {

      // Handle different error responses from the backend
      let errorMessage = 'An unexpected error occurred during login.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server. Please try again.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error('Login API call failed:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for handling the registration API call
export const registerUser = createAsyncThunk(
  'auth/register', // Action type string
  async (userData, { rejectWithValue }) => {

    try {
      const response = await axios.post('/api/auth/register', userData); //// Use your registration endpoint
      return response.data; // This will be the payload for 'fulfilled', might contain a message

    } catch (error) {

      let errorMessage = 'An unexpected error occurred during registration.';

      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server. Please try again.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }

      console.error('Registration API call failed:', error);

      return rejectWithValue(errorMessage);
    }
  }
);


// Async thunk to request a password reset link
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword', // Action type string
  async ({ email }, { rejectWithValue }) => {
    try {
      // Call the backend endpoint to request a password reset
      const response = await axios.post('/api/auth/forgot-password', { email });

      // Backend should return a success message (even if email not found, for security)
      return response.data;

    } catch (error) {
      let errorMessage = 'Failed to request password reset.';
      if (error.response) {
        // Backend might return specific errors (e.g., invalid email format)
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error('Forgot password API call failed:', error);
      return rejectWithValue(errorMessage); // Return the error message
    }
  }
);


// Async thunk to reset the password using the token
export const resetPassword = createAsyncThunk(
  'auth/resetPassword', // Action type string
  async ({ token, password }, { rejectWithValue }) => {
    try {
      // Call the backend endpoint to reset the password
      // Assuming endpoint is POST /api/auth/reset-password/:token
      // Send the new password in the request body
      const response = await axios.post(`/api/auth/reset-password/${token}`, { password });

      // Backend should return a success message
      return response.data; 

    } catch (error) {
      let errorMessage = 'Failed to reset password.';
      if (error.response) {
        // Backend might return specific errors (e.g., invalid/expired token, password validation failed)
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error(`Reset password API call failed for token ${token}:`, error);
      return rejectWithValue(errorMessage); // Return the error message
    }
  }
);


// Create the authentication slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer for manual logout (e.g., clicking logout button)
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isAuthLoading = false;
      state.error = null; // Clear any previous errors
      state.registrationSuccess = false // Also reset registration flag

      // Also remove token and user from local storage if they were stored
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },

    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    // REDUCER TO CLEAR FORGOT PASSWORD STATUS
    clearForgotPasswordStatus: (state) => {
      state.isForgotPasswordLoading = false;
      state.forgotPasswordError = null;
      state.forgotPasswordSuccess = false;
    },


    // ADDED NEW REDUCER TO CLEAR RESET PASSWORD STATUS
    clearResetPasswordStatus: (state) => {
      state.isResettingPassword = false;
      state.resetPasswordError = null;
      state.resetPasswordSuccess = false;
    },

    //-----------------------------------------
    // NEW REDUCER: To set authentication state directly from external sources(like OAuth callback)
    // This reducer will be used by AuthCallback.jsx
    setAuthState: (state, action) => {
      const { user, token } = action.payload;
      if (user && token) {
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.isAuthLoading = false; // Assume loading is complete once state is set
        state.error = null; // Clear errors
        state.isLoading = false; // Clear general loading
        console.log('Auth state set directly from payload.');
      } else {
        // If payload is invalid, log out or reset state
        console.warn('Attempted to set auth state with invalid payload.');
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isAuthLoading = false; // Still mark loading complete
        // Optionally set an error here if needed
        // state.error = "Invalid authentication data received.";
      }
    },

    //-----------------------------------------

    //Reducer to load initial state from local storage on app start
    loadAuthState: (state) => {
      try {
        const token = localStorage.getItem('accessToken');
        const userString = localStorage.getItem('user');

        if (token && userString) {

          state.token = token;
          state.user = JSON.parse(userString); // Parse the user string back into an object
          state.isAuthenticated = true;
          console.log('Auth state loaded from localStorage.');
        } else {
          // If no token or user data found, ensure state is reset
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          console.log('No auth state found in localStorage.');
        }
      } catch (e) {
        // Handle potential parsing errors if localStorage data is corrupted
        console.error('Failed to parse user data from localStorage:', e);
        // Clear potentially bad data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      } finally {
        state.isAuthLoading = false;
      }
    }

  },
  extraReducers: (builder) => {
    // Handle the states of the async thunk (loginUser)
    builder
      // When the async thunk is pending
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
        state.isAuthLoading = false
      })
      // When the async thunk is fulfilled (successful)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        state.registrationSuccess = false;
        state.isAuthLoading = false;
        console.log('Login successful:', state.user)
      })
      // When the async thunk is rejected (failed)
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null; // Clear user and token on failure
        state.token = null;
        state.isAuthenticated = false;
        // The error payload is what was passed to rejectWithValue
        state.error = action.payload || 'Login failed';
        state.isAuthLoading = false;
        console.error('Login failed, state updated:', state.error);
      })

      // handle stes for registration thunk
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
        state.isAuthLoading = false;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.registrationSuccess = true;
        state.isAuthLoading = false;
        console.error('Registration successful:', action.payload);
        // The user will typically need to verify email before isAuthenticated becomes true
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.registrationSuccess = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthLoading = false;
        console.error('Registration failed:', state.error);
      })

      // extra reducers for forgetPassword
      .addCase(forgotPassword.pending, (state) => {
        state.isForgotPasswordLoading = true;
        state.forgotPasswordError = null; // Clear previous errors
        state.forgotPasswordSuccess = false; // Reset success flag
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isForgotPasswordLoading = false;
        state.forgotPasswordSuccess = true; // Set success flag
        // The message can be accessed from action.payload if needed
        console.log('Forgot password request fulfilled:', action.payload);
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isForgotPasswordLoading = false;
        state.forgotPasswordSuccess = false; // Request failed
        state.forgotPasswordError = action.payload || 'Failed to send reset link'; // Use the error message
        console.error('Forgot password request rejected:', state.forgotPasswordError);
      })

      // Added new extraReducers for resetPassword thunk
      .addCase(resetPassword.pending, (state) => {
        state.isResettingPassword = true;
        state.resetPasswordError = null; // Clear previous errors
        state.resetPasswordSuccess = false; // Reset success flag
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isResettingPassword = false;
        state.resetPasswordSuccess = true; // Set success flag
        // The message can be accessed from action.payload if needed
        console.log('Password reset fulfilled:', action.payload);
        // Note: User is NOT automatically logged in after reset, they must login
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isResettingPassword = false;
        state.resetPasswordSuccess = false; // Reset failed
        state.resetPasswordError = action.payload || 'Failed to reset password'; // Use the error message
        console.error('Password reset rejected:', state.resetPasswordError);
      });

  },
});

// Export the synchronous actions
export const { logout, clearRegistrationSuccess, clearAuthError,
  loadAuthState, clearForgotPasswordStatus, clearResetPasswordStatus,
  setAuthState } = authSlice.actions;

// Export the reducer as the default export
export default authSlice.reducer;

