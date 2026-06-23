import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_PAYSTACK_BASE_URL,
    headers: {
        Authorization: `Bearer sk_test_4261de68b79d24467a76a311d70254429923d9fa`,
        "Content-Type": "application/json",
    },
});

class ApiClient<T, PostDataType> {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  get = async (headers?: Record<string, string>) => {
    try {
      const response = await axiosInstance.get<T>(this.endpoint, { headers });
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  post = async (data: PostDataType, headers?: Record<string, string>) => {
    try {
      return axiosInstance.post<T>(this.endpoint, data, { headers }).then((res) => res.data);
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
  };

  patch = async (data: PostDataType, headers?: Record<string, string>) => {
    try {
      const response = await axiosInstance.patch<T>(this.endpoint, data, { headers });
      return response.data;
    } catch (error) {
      console.error("Error patching data:", error);
      throw error;
    }
  };

  delete = async (headers?: Record<string, string>) => {
    try {
      const response = await axiosInstance.delete<T>(this.endpoint, { headers });
      return response.data;
    } catch (error) {
      console.error("Error deleting data:", error);
      throw error;
    }
  };
}

export default ApiClient;
