import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance as axios } from '../../util/axiosInstance';

const initialState = {
    logs: [],
    pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 20
    },
    isLoading: false,
    error: null,
};

// Async Thunk to fetch logs
export const fetchAuditLogs = createAsyncThunk(
    'admin/fetchAuditLogs',
    async (page = 1, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(`/api/admin/logs?page=${page}&limit=20`, { headers });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.error || error.message;
            return rejectWithValue(message);
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearAdminState: (state) => {
            state.logs = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAuditLogs.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAuditLogs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.logs = action.payload.logs;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchAuditLogs.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;