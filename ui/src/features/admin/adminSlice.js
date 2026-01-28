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
    reports: [],

    // Add stats object
    stats: null,
    isStatsLoading: false,
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


// --- Thunk: Fetch Reports ---
export const fetchReports = createAsyncThunk(
    'admin/fetchReports',
    async (_, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get('/api/admin/reports', { headers });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch reports');
        }
    }
);

// --- Thunk: Dismiss Report ---
export const dismissReport = createAsyncThunk(
    'admin/dismissReport',
    async (reportId, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`/api/admin/reports/${reportId}`, { headers });
            return reportId; // Return ID to remove from state
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to dismiss report');
        }
    }
);


// --- Thunk: Fetch Stats ---
export const fetchSystemStats = createAsyncThunk(
    'admin/fetchSystemStats',
    async (_, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get('/api/admin/stats', { headers });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch stats');
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
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.reports = action.payload;
            })
            .addCase(dismissReport.fulfilled, (state, action) => {
                state.reports = state.reports.filter(r => r.id !== action.payload);
            })
            .addCase(fetchSystemStats.pending, (state) => {
                state.isStatsLoading = true;
            })
            .addCase(fetchSystemStats.fulfilled, (state, action) => {
                state.isStatsLoading = false;
                state.stats = action.payload;
            })
            .addCase(fetchSystemStats.rejected, (state) => {
                state.isStatsLoading = false;
            });

    }
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;