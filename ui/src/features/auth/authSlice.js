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
        console.log('Login successful:', state.user); 
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
      });

  },
});

// Export the synchronous actions
export const { logout, clearRegistrationSuccess, clearAuthError, loadAuthState } = authSlice.actions;

// Export the reducer as the default export
export default authSlice.reducer;

