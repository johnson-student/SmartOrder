import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

const unwrap = (body) => body.data;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Me',
    'Orders',
    'Order',
    'Categories',
    'Items',
    'Tables',
    'Qr',
    'Staff',
    'Restaurant',
    'Report',
    'Menu',
    'Tracked',
  ],
  endpoints: (b) => ({
    // ---- auth ----
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
      transformResponse: unwrap,
    }),
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', data: body }),
      transformResponse: unwrap,
    }),
    getMe: b.query({
      query: () => ({ url: '/auth/me' }),
      transformResponse: unwrap,
      providesTags: ['Me'],
    }),

    // ---- orders (staff) ----
    getOrders: b.query({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Orders'],
    }), // returns { data: [...], meta }
    getOrder: b.query({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: b.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/status`, method: 'PATCH', data: body }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => ['Orders', { type: 'Order', id }, 'Report'],
    }),

    // ---- restaurant ----
    getRestaurant: b.query({
      query: () => ({ url: '/restaurant' }),
      transformResponse: unwrap,
      providesTags: ['Restaurant'],
    }),
    updateRestaurant: b.mutation({
      query: (body) => ({ url: '/restaurant', method: 'PUT', data: body }),
      transformResponse: unwrap,
      invalidatesTags: ['Restaurant', 'Me'],
    }),

    // ---- categories ----
    getCategories: b.query({
      query: () => ({ url: '/categories' }),
      transformResponse: unwrap,
      providesTags: ['Categories'],
    }),
    createCategory: b.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', data: body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: b.mutation({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', data: body }),
      invalidatesTags: ['Categories', 'Items'],
    }),

    // ---- menu items ----
    getMenuItems: b.query({
      query: (params) => ({ url: '/menu-items', params }),
      transformResponse: unwrap,
      providesTags: ['Items'],
    }),
    createMenuItem: b.mutation({
      query: (body) => ({ url: '/menu-items', method: 'POST', data: body }),
      invalidatesTags: ['Items'],
    }),
    updateMenuItem: b.mutation({
      query: ({ id, ...body }) => ({ url: `/menu-items/${id}`, method: 'PUT', data: body }),
      invalidatesTags: ['Items'],
    }),

    // ---- tables + QR ----
    getTables: b.query({
      query: () => ({ url: '/tables' }),
      transformResponse: unwrap,
      providesTags: ['Tables'],
    }),
    createTable: b.mutation({
      query: (body) => ({ url: '/tables', method: 'POST', data: body }),
      invalidatesTags: ['Tables'],
    }),
    updateTable: b.mutation({
      query: ({ id, ...body }) => ({ url: `/tables/${id}`, method: 'PUT', data: body }),
      invalidatesTags: ['Tables'],
    }),
    getTableQr: b.query({
      query: (id) => ({ url: `/tables/${id}/qr` }),
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'Qr', id }],
    }),
    generateQr: b.mutation({
      query: (id) => ({ url: `/tables/${id}/qr`, method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, id) => [{ type: 'Qr', id }, 'Tables'],
    }),

    // ---- staff ----
    getStaff: b.query({
      query: () => ({ url: '/staff' }),
      transformResponse: unwrap,
      providesTags: ['Staff'],
    }),
    createStaff: b.mutation({
      query: (body) => ({ url: '/staff', method: 'POST', data: body }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: b.mutation({
      query: ({ id, ...body }) => ({ url: `/staff/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Staff'],
    }),

    // ---- reports ----
    getReportSummary: b.query({
      query: (params) => ({ url: '/reports/summary', params }),
      transformResponse: unwrap,
      providesTags: ['Report'],
    }),

    // ---- customer (public, no sign-in) ----
    getPublicMenu: b.query({
      query: (qrToken) => ({ url: `/public/menu/${qrToken}` }),
      transformResponse: unwrap,
      providesTags: (_r, _e, token) => [{ type: 'Menu', id: token }],
    }),
    createOrder: b.mutation({
      query: (body) => ({ url: '/public/orders', method: 'POST', data: body }),
      transformResponse: unwrap,
    }),
    getTrackedOrder: b.query({
      query: (orderToken) => ({ url: `/public/orders/${orderToken}` }),
      transformResponse: unwrap,
      providesTags: (_r, _e, token) => [{ type: 'Tracked', id: token }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useGetRestaurantQuery,
  useUpdateRestaurantMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useGetTableQrQuery,
  useGenerateQrMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useGetReportSummaryQuery,
  useGetPublicMenuQuery,
  useCreateOrderMutation,
  useGetTrackedOrderQuery,
} = api;
