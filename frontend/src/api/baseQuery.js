import axiosInstance from './axiosInstance';

// RTK Query asks this function to talk to the server. We use Axios as the transport.
// It returns the full JSON body: { success, data, meta? }.
export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const response = await axiosInstance.request({ url, method, data, params });
      return { data: response.data };
    } catch (error) {
      if (error.response) {
        return { error: { status: error.response.status, data: error.response.data } };
      }
      return { error: { status: 'NETWORK_ERROR', data: { error: { message: error.message } } } };
    }
  };
