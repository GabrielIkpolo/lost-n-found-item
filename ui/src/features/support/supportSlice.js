import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance as axios } from '../../util/axiosInstance';
import { addNotification, NotificationType } from '../notifications/notificationsSlice';

const initialState = {
  tickets: [],
  currentThread: null,
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,
  createSuccess: false,
  isReplying: false,
  replyError: null,
  replySuccess: false,
};

// Async Thunk to fetch all support tickets for a user
export const fetchTickets = createAsyncThunk(
  'support/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/support');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async Thunk to fetch a single ticket by ID
export const fetchTicketById = createAsyncThunk(
  'support/fetchTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/support/${ticketId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async Thunk to create a new support ticket
export const createTicket = createAsyncThunk(
  'support/createTicket',
  async ({ subject, message }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post('/api/support', { subject, message });
      dispatch(addNotification({ message: 'Ticket created successfully!', type: NotificationType.SUCCESS }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch(addNotification({ message: `Failed to create ticket: ${errorMessage}`, type: NotificationType.ERROR }));
      return rejectWithValue(errorMessage);
    }
  }
);

// Async Thunk to reply to a ticket
export const replyToTicket = createAsyncThunk(
  'support/replyToTicket',
  async ({ ticketId, message }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/support/${ticketId}/reply`, { message });
      dispatch(addNotification({ message: 'Reply sent successfully!', type: NotificationType.SUCCESS }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch(addNotification({ message: `Failed to send reply: ${errorMessage}`, type: NotificationType.ERROR }));
      return rejectWithValue(errorMessage);
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearCreateStatus: (state) => {
      state.isCreating = false;
      state.createError = null;
      state.createSuccess = false;
    },
    clearReplyStatus: (state) => {
      state.isReplying = false;
      state.replyError = null;
      state.replySuccess = false;
    },
    clearCurrentThread: (state) => {
      state.currentThread = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Ticket By ID
      .addCase(fetchTicketById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentThread = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isCreating = false;
        state.createSuccess = true;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      })
      // Reply to Ticket
      .addCase(replyToTicket.pending, (state) => {
        state.isReplying = true;
        state.replyError = null;
        state.replySuccess = false;
      })
      .addCase(replyToTicket.fulfilled, (state, action) => {
        state.isReplying = false;
        state.replySuccess = true;
        if (state.currentThread) {
          state.currentThread.messages.push(action.payload);
        }
      })
      .addCase(replyToTicket.rejected, (state, action) => {
        state.isReplying = false;
        state.replyError = action.payload;
      });
  },
});

export const { clearCreateStatus, clearReplyStatus, clearCurrentThread } = supportSlice.actions;

export default supportSlice.reducer;
