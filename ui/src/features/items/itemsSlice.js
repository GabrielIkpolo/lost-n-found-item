import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the initial state for items, including state for my items
const initialState = {
  items: [], // Array to hold the fetched items for public lists (Found)
  pagination: { // State for public list pagination info
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10, // Match default backend limit or configure
  },
  isLoading: false, // State to track if the public list is currently being fetched
  error: null, // Stores any error message from fetching the public list

  // State for fetching and displaying a single item
  currentItem: null,
  isItemLoading: false,
  itemError: null,

  // State for item creation
  isCreating: false,
  creationError: null,
  itemCreationSuccess: false,
  createdItem: null,

  // --- State for fetching and displaying *my* items ---
  myItems: [], // Array to hold items reported or claimed by the logged-in user
  myItemsPagination: { // State for my items list pagination info
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10, // Match default backend limit or configure
  },
  isMyItemsLoading: false, // State to track if my items are currently being fetched
  myItemsError: null, // Stores any error message from fetching my items
  // ------------------------------------------------------
};

// Define an async thunk to fetch items from the backend API (for public lists)
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      // This endpoint is public for 'FOUND' items, but might be protected for others
      // const token = getState().auth.token;
      // const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get('/api/items', {
        // headers,
        params: {
          page: params.page || initialState.pagination.currentPage,
          limit: params.limit || initialState.pagination.itemsPerPage,
          category: params.category || undefined,
          search: params.search || undefined,
          status: params.status || 'FOUND',
        },
      });

      return response.data;

    } catch (error) {
      let errorMessage = 'Failed to fetch items list.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error('Fetch items list API call failed:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Define a new async thunk to fetch a single item by its ID
export const fetchItemById = createAsyncThunk(
    'items/fetchItemById',
    async (itemId, { rejectWithValue, getState }) => {
      try {
        // Item details might require authentication if it's a 'LOST' item not reported by the user
        const token = getState().auth.token;
        // For simplicity now, we'll just add the token if it exists.
        // Backend middleware should handle access control.
        const headers = token ? { Authorization: `Bearer ${token}` } : {};


        const response = await axios.get(`/api/items/${itemId}`, { headers });

        return response.data;

      } catch (error) {
        let errorMessage = 'Failed to fetch item details.';
        if (error.response) {
          if (error.response.status === 404) {
              errorMessage = 'Item not found.';
          } else if (error.response.status === 401 || error.response.status === 403) {
              // Handle auth errors specifically for item details if needed
              errorMessage = 'Unauthorized to view item details.';
          }
           else {
             errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
          }
        } else if (error.request) {
          errorMessage = 'No response received from server.';
        } else {
          errorMessage = `Error sending request: ${error.message}`;
        }
        console.error(`Fetch item ${itemId} API call failed:`, error);
        return rejectWithValue(errorMessage);
      }
    }
);

// Define a new async thunk to create an item
export const createItem = createAsyncThunk(
    'items/createItem',
    async (formData, { rejectWithValue, getState }) => {
      try {
        const token = getState().auth.token;
        if (!token) {
             return rejectWithValue('Authentication required to report an item.');
        }
        const headers = {
             Authorization: `Bearer ${token}`,
        };

        const response = await axios.post('/api/items', formData, { headers });

        return response.data;

      } catch (error) {
        let errorMessage = 'Failed to report item.';
        if (error.response) {
          errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No response received from server.';
        } else {
          errorMessage = `Error sending request: ${error.message}`;
        }
        console.error('Create item API call failed:', error);
        return rejectWithValue(errorMessage);
      }
    }
);

// --- Define a new async thunk to fetch *my* items ---
// This calls the protected /api/users/my-items endpoint
export const fetchMyItems = createAsyncThunk(
    'items/fetchMyItems', // Action type string
    async (params = {}, { rejectWithValue, getState }) => {
      try {
        // --- This endpoint requires authentication ---
        const token = getState().auth.token;
        if (!token) {
             // This case should be handled by ProtectedRoute, but double-check
             return rejectWithValue('Authentication required to view your items.');
        }
        const headers = {
             Authorization: `Bearer ${token}`,
        };
        // ---------------------------------------------

        // Make the API call to fetch the user's items
        const response = await axios.get('/api/users/my-items', {
             headers,
             params: {
                page: params.page || initialState.myItemsPagination.currentPage,
                limit: params.limit || initialState.myItemsPagination.itemsPerPage,
                // Add filters specific to 'my-items' if your backend supports them
                // status: params.status || undefined, // Example: filter my items by status
             }
        });

        // Assuming your backend returns { items: [...], pagination: { totalItems, totalPages, ... } }
        return response.data; // This will be the payload for the 'fulfilled' action

      } catch (error) {
        let errorMessage = 'Failed to fetch your items.'; // Specific error message
        if (error.response) {
          errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
          // Handle 401/403 specifically if needed, e.g., redirect to login + notification
           if (error.response.status === 401 || error.response.status === 403) {
               // Optional: Dispatch logout action if token is invalid
               // const { logout } = await import('../auth/authSlice'); // Dynamic import to avoid circular dependency
               // dispatch(logout());
               errorMessage = 'Session expired or unauthorized. Please log in again.';
           }
        } else if (error.request) {
          errorMessage = 'No response received from server.';
        } else {
          errorMessage = `Error sending request: ${error.message}`;
        }
        console.error('Fetch my items API call failed:', error);
        return rejectWithValue(errorMessage); // Return the error message
      }
    }
);
// -----------------------------------------------------


// Create the items slice
const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearItems: (state) => {
        state.items = [];
        state.pagination = initialState.pagination;
        state.isLoading = false;
        state.error = null;
        state.currentItem = null;
        state.isItemLoading = false;
        state.itemError = null;
        state.isCreating = false;
        state.creationError = null;
        state.itemCreationSuccess = false;
        state.createdItem = null;
        // Also clear my items state
        state.myItems = [];
        state.myItemsPagination = initialState.myItemsPagination;
        state.isMyItemsLoading = false;
        state.myItemsError = null;
    },
     clearCurrentItem: (state) => {
        state.currentItem = null;
        state.isItemLoading = false;
        state.itemError = null;
     },
     clearItemCreationStatus: (state) => {
        state.isCreating = false;
        state.creationError = null;
        state.itemCreationSuccess = false;
        state.createdItem = null;
     },
     // --- Reducer to clear *my* items state ---
     clearMyItems: (state) => {
        state.myItems = [];
        state.myItemsPagination = initialState.myItemsPagination;
        state.isMyItemsLoading = false;
        state.myItemsError = null;
     }
     // ------------------------------------------
  },
  extraReducers: (builder) => {
    // Handle states for fetchItems (public list) thunk
    builder
      .addCase(fetchItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.pagination = {
            ...state.pagination,
            totalItems: action.payload.pagination.totalItems,
            totalPages: action.payload.pagination.totalPages,
            currentPage: action.payload.pagination.currentPage,
        };
        state.error = null;
        console.log('Items list fetched successfully.');
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isLoading = false;
        state.items = [];
        state.pagination = initialState.pagination;
        state.error = action.payload || 'Failed to fetch items list';
        console.error('Fetch items list failed:', state.error);
      })

      // Handle states for fetchItemById (single item) thunk
      .addCase(fetchItemById.pending, (state) => {
        state.isItemLoading = true;
        state.itemError = null;
        state.currentItem = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.isItemLoading = false;
        state.currentItem = action.payload;
        state.itemError = null;
        console.log('Single item fetched successfully:', action.payload?.title);
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.isItemLoading = false;
        state.currentItem = null;
        state.itemError = action.payload || 'Failed to fetch item details';
        console.error('Fetch single item failed:', state.itemError);
      })

      // Handle states for createItem thunk
      .addCase(createItem.pending, (state) => {
        state.isCreating = true;
        state.creationError = null;
        state.itemCreationSuccess = false;
        state.createdItem = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.isCreating = false;
        state.itemCreationSuccess = true;
        state.createdItem = action.payload;
        state.creationError = null;
        console.log('Item created successfully:', action.payload?.title);
        // Optional: Add the newly created item to the items list if appropriate
        // state.items.unshift(action.payload); // Add to the beginning of the list
      })
      .addCase(createItem.rejected, (state, action) => {
        state.isCreating = false;
        state.itemCreationSuccess = false;
        state.createdItem = null;
        state.creationError = action.payload || 'Failed to report item';
        console.error('Item creation failed:', state.creationError);
      })

      // --- Handle states for fetchMyItems thunk ---
      .addCase(fetchMyItems.pending, (state) => {
        state.isMyItemsLoading = true; // Use specific loading state for my items
        state.myItemsError = null; // Clear previous errors
        state.myItems = []; // Clear previous items
      })
      .addCase(fetchMyItems.fulfilled, (state, action) => {
        state.isMyItemsLoading = false;
        state.myItems = action.payload.items; // Store the fetched my items array
        state.myItemsPagination = { // Store my items pagination info
            ...state.myItemsPagination, // Keep default itemsPerPage unless backend overrides
            totalItems: action.payload.pagination.totalItems,
            totalPages: action.payload.pagination.totalPages,
            currentPage: action.payload.pagination.currentPage,
        };
        state.myItemsError = null; // Clear error on success
        console.log('My items fetched successfully.');
      })
      .addCase(fetchMyItems.rejected, (state, action) => {
        state.isMyItemsLoading = false;
        state.myItems = []; // Clear items on failure
        state.myItemsPagination = initialState.myItemsPagination; // Reset pagination on failure
        state.myItemsError = action.payload || 'Failed to fetch your items'; // Use the error message
        console.error('Fetch my items failed:', state.myItemsError);
      });
    // ---------------------------------------------
  },
});

// Export the synchronous action creators
export const { setPagination, clearItems, clearCurrentItem, clearItemCreationStatus, clearMyItems } = itemsSlice.actions; // Export clearMyItems

// Export the async thunk action creators
// export { fetchItems, fetchItemById, createItem, fetchMyItems }; // Export fetchMyItems

// Export the reducer as the default export
export default itemsSlice.reducer;