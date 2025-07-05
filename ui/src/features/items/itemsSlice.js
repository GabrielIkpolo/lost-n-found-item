import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the initial state for items, including state for a single selected item
const initialState = {
  items: [], // Array to hold the fetched items for lists
  pagination: { // State for list pagination info
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10, // Match default backend limit or configure
  },
  isLoading: false, // State to track if the list of items is currently being fetched
  error: null, // Stores any error message from fetching the list

  // --- State for fetching and displaying a single item ---
  currentItem: null, // Stores the details of the single item currently being viewed
  isItemLoading: false, // State to track if a single item is being fetched
  itemError: null, // Stores any error message from fetching a single item
  // ------------------------------------------------------
};

// Define an async thunk to fetch items from the backend API (for lists)
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
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
      let errorMessage = 'Failed to fetch items list.'; // More specific error message
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

// --- Define a new async thunk to fetch a single item by its ID ---
export const fetchItemById = createAsyncThunk(
    'items/fetchItemById', // Action type string
    async (itemId, { rejectWithValue, getState }) => {
      try {
        // const token = getState().auth.token; // Get token if accessing restricted item details later
        // const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Make the API call to fetch the specific item details
        const response = await axios.get(`/api/items/${itemId}`); // Use the dynamic ID in the URL

        // Assuming your backend returns the single item object directly
        return response.data; // This will be the payload for the 'fulfilled' action

      } catch (error) {
        let errorMessage = 'Failed to fetch item details.'; // Specific error message
        if (error.response) {
          // Check for 404 specifically
          if (error.response.status === 404) {
              errorMessage = 'Item not found.';
          } else {
             errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
          }
        } else if (error.request) {
          errorMessage = 'No response received from server.';
        } else {
          errorMessage = `Error sending request: ${error.message}`;
        }
        console.error(`Fetch item ${itemId} API call failed:`, error);
        return rejectWithValue(errorMessage); // Return the error message
      }
    }
);
// -------------------------------------------------------------------


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
        // Also clear single item state
        state.currentItem = null;
        state.isItemLoading = false;
        state.itemError = null;
    },
     // Reducer to clear single item state when leaving the detail page
     clearCurrentItem: (state) => {
        state.currentItem = null;
        state.isItemLoading = false;
        state.itemError = null;
     },
    // Add other synchronous reducers here if needed later (e.g., addItem, updateItem)
  },
  extraReducers: (builder) => {
    // Handle states for fetchItems (list) thunk
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

      // --- Handle states for fetchItemById (single item) thunk ---
      .addCase(fetchItemById.pending, (state) => {
        state.isItemLoading = true; // Use specific loading state for single item
        state.itemError = null; // Clear previous errors
        state.currentItem = null; // Clear previous item data
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.isItemLoading = false;
        state.currentItem = action.payload; // Store the fetched single item object
        state.itemError = null; // Clear error on success
        console.log('Single item fetched successfully:', action.payload?.title);
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.isItemLoading = false;
        state.currentItem = null; // Clear item data on failure
        state.itemError = action.payload || 'Failed to fetch item details'; // Use the error message
        console.error('Fetch single item failed:', state.itemError);
      });
    // ---------------------------------------------------------------
  },
});

// Export the synchronous action creators
export const { setPagination, clearItems, clearCurrentItem } = itemsSlice.actions; // Export clearCurrentItem


// Export the reducer as the default export
export default itemsSlice.reducer;