import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_NOMBA_BASE_URL,
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

  get = async () => {
    try {
      const response = await axiosInstance.get<T>(this.endpoint);
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  post = async (data: PostDataType) => {
    try {
      return axiosInstance.post<T>(this.endpoint, data).then((res) => res.data);
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
  };

  patch = async (data: PostDataType) => {
    try {
      const response = await axiosInstance.patch<T>(this.endpoint, data);
      return response.data;
    } catch (error) {
      console.error("Error patching data:", error);
      throw error;
    }
  };

  delete = async () => {
    try {
      const response = await axiosInstance.delete<T>(this.endpoint);
      return response.data;
    } catch (error) {
      console.error("Error deleting data:", error);
      throw error;
    }
  };
}

export default ApiClient;
