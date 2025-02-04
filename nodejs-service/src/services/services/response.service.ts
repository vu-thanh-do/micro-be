import { injectable } from "inversify";
@injectable()
export class ResponseDataService {
  createResponse<T>(status: number, data: T | null = null, message = "") {
    return {
      status,
      message,
      data,
    };
  }
}
