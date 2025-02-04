import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";
dotenv.config();
class Http {
  instance: AxiosInstance;
  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
const apiGetInfoUserEzV4 = new Http(
  process.env.API_GET_INFO_USER_EZV4 as string
).instance;
const api2 = new Http("https://api.another.com").instance;

export { apiGetInfoUserEzV4, api2 };
