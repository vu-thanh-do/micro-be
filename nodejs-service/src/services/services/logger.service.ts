import { injectable } from "inversify";
import { ILogger } from "../../types/logs.type";
import Logs from "../../models/models-project/logs.model";
import { GenericService } from "./generic.service";
import HttpError from "../../errors/httpError";

@injectable()
export class LoggerService extends GenericService<ILogger> {
  constructor() {
    super(Logs);
  }

  async getAllLogs(page: number = 1, limit: number = 10) {
    try {
      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        lean: true
      };

      const result = await Logs.paginate({}, options);
      return {
        status: 200,
        message: "Get logs successfully",
        data: result.docs,
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage
        }
      };
    } catch (error) {
      throw new HttpError('Error getting logs', 500);
    }
  }
}