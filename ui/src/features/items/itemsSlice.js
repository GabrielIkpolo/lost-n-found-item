import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
import { axiosInstance as axios } from '../../util/axiosInstance';

// Define the initial state for items, including state for my items
const initialState = {
  items: [],
  pagination: {
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

  // --- State for claiming an item ---
  isClaiming: false, // State to track if an item is currently being claimed
  claimError: null, // Stores any error message from claiming
  claimSuccess: false, // Flag to indicate successful claim
  claimedItem: null, // Stores the updated item data after a successful claim
  // -----------------------------------

  // --- State for updating an item ---

  isUpdating: false, // State to track if an item is currently being updated
  updateError: null, // Stores any error message from updating
  updateSuccess: false, // Flag to indicate successful update
  updatedItem: null, // Stores the updated item data after a successful update

  // --- State for deleting an item ---

  isDeleting: false, // State to track if an item is currently being deleted
  deleteError: null, // Stores any error message from deleting
  deleteSuccess: false, // Flag to indicate successful deletion
  deletedItemId: null, // Stores the ID of the item successfully deleted


  // --- State for status updates ---

  isMarkingReturned: false,
  markReturnedError: null,
  markReturnedSuccess: false,

  isConfirmingReceived: false,
  confirmReceivedError: null,
  confirmReceivedSuccess: false,

  isCancellingClaim: false,
  cancelClaimError: null,
  cancelClaimSuccess: false,


  // ------------------------------------------------------
};

// Define an async thunk to fetch items from the backend API (for public lists)
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      // This endpoint is public for 'FOUND' items, but might be protected for others
      const token = getState().auth.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get('/api/items', {
        headers,
        params: {
          page: params.page || initialState.pagination.currentPage,
          limit: params.limit || initialState.pagination.itemsPerPage,
          category: params.category || undefined,
          // search: params.search || undefined,
          q: params.search || undefined,
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
        'Content-Type': 'multipart/form-data',
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


// --- Define a new async thunk to claim an item ---
//  Expects an object { itemId, proofMessage }
export const claimItem = createAsyncThunk(
  // Action type string
  'items/claimItem',
  async ({ itemId, proofMessage }, { rejectWithValue, getState }) => {
    try {
      // --- This endpoint requires authentication ---
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to claim an item.');
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      // ---------------------------------------------

      // Make the API call to claim the item (POST /api/items/claim/:id)
      const response = await axios.post(`/api/items/claim/${itemId}`, { proofMessage }, { headers });

      return response.data;

    } catch (error) {
      let errorMessage = 'Failed to claim item.';
      if (error.response) {
        // Check for specific backend validation errors (e.g., already claimed, not FOUND, user is reporter)
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Unauthorized or forbidden to claim this item.';
        } else if (error.response.status === 400) { 
          // Keep backend's specific error message for 400 errors
          errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid request to claim item.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error(`Claim item ${itemId} API call failed:`, error);
      return rejectWithValue(errorMessage); 
    }
  }
);
//-------------------------------------------------------------

// --- Define a new async thunk to update an item ---
// Expects an object like { itemId, formData } as payload
export const updateItem = createAsyncThunk(
  'items/updateItem', // Action type string
  async ({ itemId, formData }, { rejectWithValue, getState }) => {
    try {
      // --- This endpoint requires authentication ---
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to update an item.');
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      const response = await axios.put(`/api/items/${itemId}`, formData, { headers });

      // Assuming your backend returns the updated item object on success
      return response.data; // This will be the payload for the 'fulfilled' action (the updated item)

    } catch (error) {
      let errorMessage = 'Failed to update item.'; // Specific error message
      if (error.response) {
        // Check for specific backend validation errors (e.g., unauthorized, invalid data)
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Unauthorized or forbidden to update this item.';
        } else if (error.response.status === 400) { // Bad Request
          // Keep backend's specific error message for 400 errors
          errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid data provided for update.';
        } else if (error.response.status === 404) { // Not Found
          errorMessage = 'Item not found.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error(`Update item ${itemId} API call failed:`, error);
      return rejectWithValue(errorMessage); // Return the error message
    }
  }
);


// --- Define a new async thunk to delete an item ---
// Expects the item ID as payload
export const deleteItem = createAsyncThunk(
  'items/deleteItem', // Action type string
  async (itemId, { rejectWithValue, getState }) => {
    try {
      // --- This endpoint requires authentication ---
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to delete an item.');
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      // ---------------------------------------------

      // Make the API call to delete the item (DELETE /api/items/:id)
      const response = await axios.delete(`/api/items/${itemId}`, { headers });

      // Assuming your backend returns a success message or the deleted item ID on success
      // Returning the deleted item ID is often useful
      return itemId; // Return the ID of the item that was deleted

    } catch (error) {
      let errorMessage = 'Failed to delete item.'; // Specific error message
      if (error.response) {
        // Check for specific backend validation errors (e.g., unauthorized, not found)
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Unauthorized or forbidden to delete this item.';
        } else if (error.response.status === 404) { // Not Found
          errorMessage = 'Item not found.';
        }
      } else if (error.request) {
        errorMessage = 'No response received from server.';
      } else {
        errorMessage = `Error sending request: ${error.message}`;
      }
      console.error(`Delete item ${itemId} API call failed:`, error);
      return rejectWithValue(errorMessage); // Return the error message
    }
  }
);



// --- Define new async thunks for status updates ---
// Thunk to mark an item as RETURNED (typically by the reporter after CLAIMED)
export const markItemReturned = createAsyncThunk(
  'items/markItemReturned', // Action type string
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to mark item as returned.');
      }
      const headers = { Authorization: `Bearer ${token}` };

      // Assuming a backend endpoint like PUT /api/items/:id/status/returned
      // You might need a request body if additional info is sent, but often just ID in URL is enough
      const response = await axios.put(`/api/items/${itemId}/status/returned`, {}, { headers });

      // Assuming backend returns the updated item object on success
      return response.data; // The updated item

    } catch (error) {
      let errorMessage = 'Failed to mark item as returned.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) { errorMessage = 'Unauthorized or forbidden to mark this item.'; }
        else if (error.response.status === 400) { errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid request.'; }
      } else if (error.request) { errorMessage = 'No response received from server.'; }
      else { errorMessage = `Error sending request: ${error.message}`; }
      console.error(`Mark item ${itemId} as returned API call failed:`, error);
      return rejectWithValue(errorMessage);
    }
  }
);


// Thunk to confirm receiving a claimed item (typically by the claimant)
export const confirmItemReceived = createAsyncThunk(
  'items/confirmItemReceived', // Action type string
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to confirm receiving item.');
      }
      const headers = { Authorization: `Bearer ${token}` };

      // Assuming a backend endpoint like PUT /api/items/:id/status/received (or similar)
      const response = await axios.put(`/api/items/${itemId}/status/received`, {}, { headers });

      // Assuming backend returns the updated item object on success
      return response.data; // The updated item

    } catch (error) {
      let errorMessage = 'Failed to confirm item received.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) { errorMessage = 'Unauthorized or forbidden.'; }
        else if (error.response.status === 400) { errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid request.'; }
      } else if (error.request) { errorMessage = 'No response received from server.'; }
      else { errorMessage = `Error sending request: ${error.message}`; }
      console.error(`Confirm item ${itemId} received API call failed:`, error);
      return rejectWithValue(errorMessage);
    }
  }
);


// Thunk to cancel a claim on an item (typically by the claimant)
export const cancelItemClaim = createAsyncThunk(
  'items/cancelItemClaim', // Action type string
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Authentication required to cancel item claim.');
      }
      const headers = { Authorization: `Bearer ${token}` };

      // Assuming a backend endpoint like PUT /api/items/:id/status/cancel-claim (or DELETE on claim?)
      // A PUT to a status endpoint is common.
      const response = await axios.put(`/api/items/${itemId}/status/cancel-claim`, {}, { headers });

      // Assuming backend returns the updated item object on success (status back to FOUND)
      return response.data; // The updated item

    } catch (error) {
      let errorMessage = 'Failed to cancel item claim.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
        if (error.response.status === 401 || error.response.status === 403) { errorMessage = 'Unauthorized or forbidden.'; }
        else if (error.response.status === 400) { errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid request.'; }
      } else if (error.request) { errorMessage = 'No response received from server.'; }
      else { errorMessage = `Error sending request: ${error.message}`; }
      console.error(`Cancel item ${itemId} claim API call failed:`, error);
      return rejectWithValue(errorMessage);
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

      // Reset claim state too
      state.isClaiming = false;
      state.claimError = null;
      state.claimSuccess = false;
      state.claimedItem = null;

      // Reset update state
      state.isUpdating = false;
      state.updateError = null;
      state.updateSuccess = false;
      state.updatedItem = null;

      //Reset dete state
      state.isDeleting = false;
      state.deleteError = null;
      state.deleteSuccess = null;
      state.deletedItemId = null;

      // Reset status update states
      state.isMarkingReturned = false;
      state.markReturnedError = null;
      state.markReturnedSuccess = false;

      state.isConfirmingReceived = false;
      state.confirmReceivedError = null;
      state.confirmReceivedSuccess = false;

      state.isCancellingClaim = false;
      state.cancelClaimError = null;
      state.cancelClaimSuccess = false;

    },

    //-------------------------
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
    },

    // --- Reducer to clear item claim status ---
    clearClaimStatus: (state) => {
      state.isClaiming = false;
      state.claimError = null;
      state.claimSuccess = false;
      state.claimedItem = null;
    },

    // --- Reducer to clear item update status ---
    clearUpdateStatus: (state) => {
      state.isUpdating = false;
      state.updateError = null;
      state.updateSuccess = false;
      state.updatedItem = null; // Clear updated item data too
    },

    // --- Reducer to calim item delete status
    clearDeleteStatus: (state) => {
      state.isDeleting = false;
      state.deleteError = null;
      state.deleteSuccess = false;
      state.deletedItemId = null; // Clear deleted item ID too
    },

    // --- Reducers to clear specific status update states ---
    clearMarkReturnedStatus: (state) => {
      state.isMarkingReturned = false;
      state.markReturnedError = null;
      state.markReturnedSuccess = false;
    },
    clearConfirmReceivedStatus: (state) => {
      state.isConfirmingReceived = false;
      state.confirmReceivedError = null;
      state.confirmReceivedSuccess = false;
    },
    clearCancelClaimStatus: (state) => {
      state.isCancellingClaim = false;
      state.cancelClaimError = null;
      state.cancelClaimSuccess = false;
    },

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
        // Optional: Update the item in the main list if it exists there
        // const index = state.items.findIndex(item => item.id === action.payload.id);
        // if (index !== -1) { state.items[index] = action.payload; }
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
      })

      // --- Handle states for claimItem thunk ---
      .addCase(claimItem.pending, (state) => {
        state.isClaiming = true;
        state.claimError = null;
        state.claimSuccess = false;
        state.claimedItem = null;
      })
      .addCase(claimItem.fulfilled, (state, action) => {
        state.isClaiming = false;
        state.claimSuccess = true;
        state.claimedItem = action.payload;
        state.claimError = null;
        console.log('Item claimed successfully:', action.payload?.title);

        // Optional: Update the item in the main items list if it exists there
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        // Optional: Update the item in myItems list if it exists there
        const myItemsIndex = state.myItems.findIndex(item => item.id === action.payload.id);
        if (myItemsIndex !== -1) {
          state.myItems[myItemsIndex] = action.payload;
        }
      })
      .addCase(claimItem.rejected, (state, action) => {
        state.isClaiming = false;
        state.claimSuccess = false;
        state.claimedItem = null;
        state.claimError = action.payload || 'Failed to claim item';
        console.error('Item claim failed:', state.claimError);
      })

      // --- Handle state for updateItem thunk
      .addCase(updateItem.pending, (state) => {
        state.isUpdating = true; // Use specific loading state for update
        state.updateError = null; // Clear previous errors
        state.updateSuccess = false; // Reset success flag
        state.updatedItem = null; // Clear previous updated item data
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateSuccess = true; // Set success flag
        state.updatedItem = action.payload; // Store the updated item data
        state.updateError = null; // Clear error on success
        console.log('Item updated successfully:', action.payload?.title);

        // Optional: Update the item in the main items list if it exists there
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        // Optional: Update the item in myItems list if it exists there
        const myItemsIndex = state.myItems.findIndex(item => item.id === action.payload.id);
        if (myItemsIndex !== -1) {
          state.myItems[myItemsIndex] = action.payload;
        }

        // If the updated item is the currently viewed item detail, update it too
        if (state.currentItem && state.currentItem.id === action.payload.id) {
          state.currentItem = action.payload;
        }

      })
      .addCase(updateItem.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateSuccess = false; // Update failed
        state.updatedItem = null; // No item updated
        state.updateError = action.payload || 'Failed to update item'; // Use the error message
        console.error('Item update failed:', state.updateError);
      })

      // --- Handle states for deleteItem thunk ---
      .addCase(deleteItem.pending, (state) => {
        state.isDeleting = true; // Use specific loading state for deletion
        state.deleteError = null; // Clear previous errors
        state.deleteSuccess = false; // Reset success flag
        state.deletedItemId = null; // Clear previous deleted item ID
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.deleteSuccess = true; // Set success flag
        const deletedId = action.payload; // The deleted item ID returned by the thunk
        state.deletedItemId = deletedId; // Store the deleted item ID
        state.deleteError = null; // Clear error on success
        console.log(`Item deleted successfully: ${deletedId}`);

        // --- Remove the item from the lists and current item state ---
        // Remove from the main items list
        state.items = state.items.filter(item => item.id !== deletedId);
        // Remove from the myItems list
        state.myItems = state.myItems.filter(item => item.id !== deletedId);
        // If the deleted item was the current item being viewed, clear currentItem
        if (state.currentItem && state.currentItem.id === deletedId) {
          state.currentItem = null;
          state.itemError = 'Item deleted.'; // Set a message indicating it was deleted
        }
        // Note: Pagination totals might need recalculation or re-fetching the list
        // Re-fetching the relevant list (public or my items) is often simpler:
        // This would require dispatching another thunk here, which is not ideal in reducers.
        // A component listening to deleteSuccess can trigger the re-fetch.
        // For now, the item is removed from the current state arrays.
        // ---------------------------------------------------------------
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteSuccess = false; // Deletion failed
        state.deletedItemId = null; // No item deleted
        state.deleteError = action.payload || 'Failed to delete item'; // Use the error message
        console.error('Item deletion failed:', state.deleteError);
      })


      // --- Handle states for markItemReturned thunk ---
      .addCase(markItemReturned.pending, (state) => {
        state.isMarkingReturned = true;
        state.markReturnedError = null;
        state.markReturnedSuccess = false;
      })
      .addCase(markItemReturned.fulfilled, (state, action) => {
        state.isMarkingReturned = false;
        state.markReturnedSuccess = true;
        const updatedItem = action.payload;
        state.markReturnedError = null;
        console.log('Item marked Returned successfully:', updatedItem?.title);
        // Update item in lists and current item
        const index = state.items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) { state.items[index] = updatedItem; }
        const myItemsIndex = state.myItems.findIndex(item => item.id === updatedItem.id);
        if (myItemsIndex !== -1) { state.myItems[myItemsIndex] = updatedItem; }
        if (state.currentItem && state.currentItem.id === updatedItem.id) {
          state.currentItem = updatedItem;
        }
      })
      .addCase(markItemReturned.rejected, (state, action) => {
        state.isMarkingReturned = false;
        state.markReturnedSuccess = false;
        state.markReturnedError = action.payload || 'Failed to mark item as returned';
        console.error('Mark item as returned failed:', state.markReturnedError);
      })
      // ------------------------------------------------

      // --- Handle states for confirmItemReceived thunk ---
      .addCase(confirmItemReceived.pending, (state) => {
        state.isConfirmingReceived = true;
        state.confirmReceivedError = null;
        state.confirmReceivedSuccess = false;
      })
      .addCase(confirmItemReceived.fulfilled, (state, action) => {
        state.isConfirmingReceived = false;
        state.confirmReceivedSuccess = true;
        const updatedItem = action.payload;
        state.confirmReceivedError = null;
        console.log('Item confirmed received successfully:', updatedItem?.title);
        // Update item in lists and current item
        const index = state.items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) { state.items[index] = updatedItem; }
        const myItemsIndex = state.myItems.findIndex(item => item.id === updatedItem.id);
        if (myItemsIndex !== -1) { state.myItems[myItemsIndex] = updatedItem; }
        if (state.currentItem && state.currentItem.id === updatedItem.id) {
          state.currentItem = updatedItem;
        }
      })
      .addCase(confirmItemReceived.rejected, (state, action) => {
        state.isConfirmingReceived = false;
        state.confirmReceivedSuccess = false;
        state.confirmReceivedError = action.payload || 'Failed to confirm item received';
        console.error('Confirm item received failed:', state.confirmReceivedError);
      })

      // ---------------------------------------------------

      // --- Handle states for cancelItemClaim thunk ---
      .addCase(cancelItemClaim.pending, (state) => {
        state.isCancellingClaim = true;
        state.cancelClaimError = null;
        state.cancelClaimSuccess = false;
      })
      .addCase(cancelItemClaim.fulfilled, (state, action) => {
        state.isCancellingClaim = false;
        state.cancelClaimSuccess = true;
        const updatedItem = action.payload;
        state.cancelClaimError = null;
        console.log('Item claim cancelled successfully:', updatedItem?.title);
        // Update item in lists and current item
        const index = state.items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) { state.items[index] = updatedItem; }
        const myItemsIndex = state.myItems.findIndex(item => item.id === updatedItem.id);
        if (myItemsIndex !== -1) { state.myItems[myItemsIndex] = updatedItem; }
        if (state.currentItem && state.currentItem.id === updatedItem.id) {
          state.currentItem = updatedItem;
        }
      })
      .addCase(cancelItemClaim.rejected, (state, action) => {
        state.isCancellingClaim = false;
        state.cancelClaimSuccess = false;
        state.cancelClaimError = action.payload || 'Failed to cancel item claim';
        console.error('Cancel item claim failed:', state.cancelClaimError);
      })


    // ---------------------------------------------
  },
});

// Export the synchronous action creators
export const { setPagination, clearItems,
  clearCurrentItem, clearItemCreationStatus,
  clearMyItems, clearClaimStatus, claimedItem,
  clearUpdateStatus, clearDeleteStatus,
  clearMarkReturnedStatus,
  clearConfirmReceivedStatus,
  clearCancelClaimStatus } = itemsSlice.actions; // Export clearMyItems


// Export the reducer as the default export
export default itemsSlice.reducer;