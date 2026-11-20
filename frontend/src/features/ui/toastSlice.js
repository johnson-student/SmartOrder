import { createSlice, nanoid } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'toasts',
  initialState: [],
  reducers: {
    showToast: {
      reducer: (state, { payload }) => {
        state.push(payload);
        if (state.length > 4) state.shift();
      },
      prepare: (message, tone = 'info') => ({ payload: { id: nanoid(), message, tone } }),
    },
    dismissToast: (state, { payload }) => state.filter((t) => t.id !== payload),
  },
});

export const { showToast, dismissToast } = slice.actions;
export default slice.reducer;
