import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; 

// Define the initial state for authentication
const initialState = {
  user: null, // Stores user information (e.g., { id, name, email, role })
  token: null, // Stores the access token (JWT)
  isAuthenticated: false, // Boolean to track authentication status
  isLoading: false, // State to track if an async operation (like login) is in progress
  error: null, // Stores any error message from async operations
};

// Define an async thunk for handling the login API call
// createAsyncThunk automatically handles pending, fulfilled, and rejected states
export const loginUser = createAsyncThunk(

  'auth/loginUser', // Action type string (sliceName/actionName)

  async (credentials, { rejectWithValue }) => {

    try {
      const response = await axios.post('/api/auth/login', credentials); // Our server login endpoint
     
      // Assuming our backend returns { accessToken, user: { id, name, email, role } }
      const { accessToken, user } = response.data;

      // Optionally, store the token in local storage for persistence across sessions
      // Be mindful of security implications when storing tokens in local storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user)); // Store user details if needed

      return { accessToken, user }; // This will be the payload for the 'fulfilled' action
   
    } catch (error) {
      
      // Handle different error responses from the backend
      let errorMessage = 'An unexpected error occurred during login.';
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
         // If you want to pass the whole error response or data:
         // return rejectWithValue(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please try again.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error('Login API call failed:', error); // Log the detailed error on the client side

      // Use rejectWithValue to return a specific payload on rejection
      return rejectWithValue(errorMessage); // Return the error message to the 'rejected' action payload
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
      state.isLoading = false; // Ensure loading state is reset on logout
      state.error = null; // Clear any previous errors

      // Also remove token and user from local storage if they were stored
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    // Optional: Reducer to load initial state from local storage on app start
    loadAuthState: (state) => {
        const token = localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');
        if (token && user) {
            state.token = token;
            state.user = JSON.parse(user);
            state.isAuthenticated = true;
        }
    }
  },
  extraReducers: (builder) => {
    // Add reducers to handle the states of the async thunk (loginUser)
    builder
      // When the async thunk is pending
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear previous errors when a new request starts
      })
      // When the async thunk is fulfilled (successful)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null; // Clear error on success
        console.log('Login successful:', state.user); // Log successful login
      })
      // When the async thunk is rejected (failed)
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null; // Clear user and token on failure
        state.token = null;
        state.isAuthenticated = false;
        // The error payload is what was passed to rejectWithValue
        state.error = action.payload || 'Login failed'; // Use the error message returned from thunk or a default
        console.error('Login failed:', state.error); // Log login failure
      });
  },
});

// Export the synchronous actions
export const { logout } = authSlice.actions;

// Export the reducer as the default export
export default authSlice.reducer;

