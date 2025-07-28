import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
import { axiosInstance as axios } from '../util/axiosInstance';


// Define the initial state for user management (admin view)
const initialState = {
  users: [], // Array to hold all users for admin view
  isLoading: false, // State to track if fetching users is in progress
  error: null, // Stores any error message from user management operations

  // State for individual user actions (role update, deletion)
  isUpdatingRole: false,
  updateRoleError: null,
  updateRoleSuccess: false,
  updatedUser: null, // Might store the user object after a successful role update

  isDeletingUser: false,
  deleteUserError: null,
  deleteUserSuccess: false,
  deletedUserId: null, // Stores the ID of the user successfully deleted
};

// --- Async Thunks for Admin User Management ---

// Thunk to fetch all users (requires admin privileges)
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers', // Action type string
  async (_, { rejectWithValue, getState }) => {
    try {
      // --- This endpoint requires authentication AND admin role ---
      const token = getState().auth.token;
      if (!token) {
        // This case should be handled by isAdmin middleware on backend,
        // but good to check on frontend too for clarity.
        return rejectWithValue('Authentication required.');
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      // ----------------------------------------------------------

      // Make the API call to fetch all users
      // Assuming the endpoint is GET /api/users
      const response = await axios.get('/api/users', { headers });

      // The backend should return an array of user objects
      return response.data; // This will be the payload for 'fulfilled'

    } catch (error) {
      let errorMessage = 'Failed to fetch users.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) {
           // Optional: Dispatch logout if token is invalid or user is not admin
           // const { logout } = await import('../auth/authSlice'); // Dynamic import
           // dispatch(logout());
           errorMessage = 'Unauthorized or insufficient privileges to view users.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error('Fetch all users API call failed:', error);
      return rejectWithValue(errorMessage); // Return the error message
    }
  }
);


// Thunk to update a user's role (requires super admin privileges on backend)
// Expects an object like { userId, newRole } as payload
export const updateUserRole = createAsyncThunk(
    'users/updateUserRole',
    async ({ userId, role }, { rejectWithValue, getState }) => { // Renamed newRole to role to match backend controller
        try {
            const token = getState().auth.token;
            if (!token) {
                return rejectWithValue('Authentication required to update user role.');
            }
            const headers = { Authorization: `Bearer ${token}` };

            // Make the API call to update the user's role
            // Assuming the endpoint is PUT /api/users/:id/role
            const response = await axios.put(`/api/users/${userId}/role`, { role }, { headers }); // Send { role: newRole } in body

            // Assuming backend returns the updated user object on success
            return response.data; // This will be the payload for 'fulfilled' (the updated user)

        } catch (error) {
            let errorMessage = 'Failed to update user role.';
            if (error.response) {
                errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
                 if (error.response.status === 401 || error.response.status === 403) { errorMessage = 'Unauthorized or insufficient privileges to update user role.'; }
                 else if (error.response.status === 400) { errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid role provided.'; }
                 else if (error.response.status === 404) { errorMessage = 'User not found.'; }
            } else if (error.request) { errorMessage = 'No response received from server.'; }
            else { errorMessage = `Error sending request: ${error.message}`; }
            console.error(`Update user ${userId} role API call failed:`, error);
            return rejectWithValue(errorMessage);
        }
    }
);


// Thunk to delete a user (requires admin/super admin privileges on backend)
// Expects the user ID as payload
export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (userId, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            if (!token) {
                return rejectWithValue('Authentication required to delete a user.');
            }
            const headers = { Authorization: `Bearer ${token}` };

            // Make the API call to delete the user
            // Assuming the endpoint is DELETE /api/users/:id
            const response = await axios.delete(`/api/users/${userId}`, { headers });

            // Assuming backend returns the deleted user's ID or a success message
             return userId; // Return the ID of the user that was deleted

        } catch (error) {
            let errorMessage = 'Failed to delete user.';
            if (error.response) {
                errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
                if (error.response.status === 401 || error.response.status === 403) { errorMessage = 'Unauthorized or insufficient privileges to delete user.'; }
                 else if (error.response.status === 404) { errorMessage = 'User not found.'; }
                 else if (error.response.status === 409) { errorMessage = 'Cannot delete user due to related data.'; } // Conflict error, e.g., P2003
            } else if (error.request) { errorMessage = 'No response received from server.'; }
            else { errorMessage = `Error sending request: ${error.message}`; }
            console.error(`Delete user ${userId} API call failed:`, error);
            return rejectWithValue(errorMessage);
        }
    }
);



// Create the user slice
const userSlice = createSlice({
  name: 'users', // Use 'users' for the slice name as it manages user *list*
  initialState,
  reducers: {
    // Reducer to clear specific error states
    clearUserError: (state) => {
        state.error = null;
    },
     clearUpdateRoleStatus: (state) => {
         state.isUpdatingRole = false;
         state.updateRoleError = null;
         state.updateRoleSuccess = false;
         state.updatedUser = null;
     },
     clearDeleteUserStatus: (state) => {
        state.isDeletingUser = false;
        state.deleteUserError = null;
        state.deleteUserSuccess = false;
        state.deletedUserId = null;
     },
     // Reducer to clear ALL user management state
     clearUserManagementState: (state) => {
        state.users = [];
        state.isLoading = false;
        state.error = null;
        state.isUpdatingRole = false;
        state.updateRoleError = null;
        state.updateRoleSuccess = false;
        state.updatedUser = null;
        state.isDeletingUser = false;
        state.deleteUserError = null;
        state.deleteUserSuccess = false;
        state.deletedUserId = null;
     }
  },
  extraReducers: (builder) => {
    builder
      // Handle states for fetchAllUsers thunk
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear previous errors
        // Clear specific action statuses when fetching the list
        state.isUpdatingRole = false;
        state.updateRoleSuccess = false;
        state.updateRoleError = null;
        state.isDeletingUser = false;
        state.deleteUserSuccess = false;
        state.deleteUserError = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload; // Store the fetched users array
        state.error = null; // Clear error on success
        console.log('All users fetched successfully.');
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.users = []; // Clear users on failure
        state.error = action.payload || 'Failed to fetch users'; // Use the error message
        console.error('Fetch all users failed:', state.error);
      })

      // Handle states for updateUserRole thunk
      .addCase(updateUserRole.pending, (state) => {
          state.isUpdatingRole = true;
          state.updateRoleError = null;
          state.updateRoleSuccess = false;
          state.updatedUser = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
          state.isUpdatingRole = false;
          state.updateRoleSuccess = true;
          state.updatedUser = action.payload.user; // Assuming backend returns { message, user }

          // Update the user in the existing users array
          const updatedUserIndex = state.users.findIndex(user => user.id === state.updatedUser.id);
          if (updatedUserIndex !== -1) {
              state.users[updatedUserIndex] = state.updatedUser;
          }

          state.updateRoleError = null;
          console.log('User role updated successfully:', state.updatedUser);
      })
      .addCase(updateUserRole.rejected, (state, action) => {
          state.isUpdatingRole = false;
          state.updateRoleSuccess = false;
          state.updatedUser = null;
          state.updateRoleError = action.payload || 'Failed to update user role';
          console.error('User role update failed:', state.updateRoleError);
      })

      // Handle states for deleteUser thunk
      .addCase(deleteUser.pending, (state) => {
          state.isDeletingUser = true;
          state.deleteUserError = null;
          state.deleteUserSuccess = false;
          state.deletedUserId = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
          state.isDeletingUser = false;
          state.deleteUserSuccess = true;
          state.deletedUserId = action.payload; // The user ID that was deleted

          // Remove the deleted user from the users array
          state.users = state.users.filter(user => user.id !== state.deletedUserId);

          state.deleteUserError = null;
          console.log(`User ${state.deletedUserId} deleted successfully.`);
      })
      .addCase(deleteUser.rejected, (state, action) => {
          state.isDeletingUser = false;
          state.deleteUserSuccess = false;
          state.deletedUserId = null;
          state.deleteUserError = action.payload || 'Failed to delete user';
          console.error('User deletion failed:', state.deleteUserError);
      });
  },
});

// Export the synchronous action creators
export const {
    clearUserError,
    clearUpdateRoleStatus,
    clearDeleteUserStatus,
    clearUserManagementState } = userSlice.actions;


export default userSlice.reducer;