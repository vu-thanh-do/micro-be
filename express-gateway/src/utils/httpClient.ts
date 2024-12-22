import axios, { AxiosRequestConfig } from "axios";

export const httpClient = async (config: AxiosRequestConfig) => {
  try {
    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error.message;
  }
};
