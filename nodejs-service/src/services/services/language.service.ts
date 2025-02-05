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
      console.log(options,'options')
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
        console.log(error,'error')
      return error
    }
  }
}
