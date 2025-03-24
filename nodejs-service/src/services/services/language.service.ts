import { ILogger } from "../../types/logs.type";
import Logs from "../../models/models-project/logs.model";
import { LogsRepository } from "../../repositories/logs.repository";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { injectable } from "inversify";
import { GenericService } from "./generic.service";
import { ILanguage } from "../../types/language.type";
import Language from "../../models/models-project/language.model";

@injectable()
export class LanguageService extends GenericService<ILanguage> {
  constructor() {
    super(Language);
  }
  async getAllGroup(options: any) {
    try {
      let query;
      console.log(options, "options");
      const newOption = {
        sort: { createdAt: -1 },
        page: options.page,
        pageSize: options.page,
      };
      if (options.group && !options.query) {
        query = {
          $and: [
            {
              $or: [
                {
                  group: {
                    $regex: options.group,
                    $options: "i",
                  },
                },
              ],
            },
          ],
        };
      } else if (!options.group && options.query) {
        query = {
          $and: [
            {
              $or: [
                {
                  [`message.${options.language}`]: {
                    $regex: options.group,
                    $options: "i",
                  },
                },
              ],
            },
          ],
        };
      } else if (options.group && options.query) {
        query = {
          $and: [
            {
              $or: [
                {
                  group: {
                    $regex: options.group,
                    $options: "i",
                  },
                },
              ],
            },
            {
              $or: [
                {
                  [`message.${options.language}`]: {
                    $regex: options.group,
                    $options: "i",
                  },
                },
              ],
            },
          ],
        };
      }
      const language = await (Language as any).paginate(query, newOption);
      return language;
    } catch (error) {
      console.log(error, "error");
      return error;
    }
  }
  async getGroup(page: number = 1, limit: number = 10) {
    try {
      const customLabels = {
        totalDocs: 'total',
        docs: 'data',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pageCount',
        pagingCounter: 'slNo',
        meta: 'paginator'
      };
      
      const options = {
        page: page,
        limit: limit,
        customLabels: customLabels
      };
      
      const aggregateQuery = Language.aggregate([
        { $match: { group: { $ne: null, $exists: true } } },
        { $group: { _id: "$group", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { nameGroup: "$_id", count: 1, _id: 0 } }
      ]);
      
      const result = await Language.aggregatePaginate(aggregateQuery, options);
      return result;
    } catch (error) {
      console.log(error, "error");
      return error;
    }
  }
}
