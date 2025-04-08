import { JsonController, Get, Req, Res } from "routing-controllers";
import { Request, Response } from "express";
import { InfoUserEzV4 } from "../../../services/service-Ezv4/infoUserEzV4";
import { inject } from "inversify";
import { injectable } from "inversify";
@injectable()
@JsonController("/info-user")
export class InfoUserController {
  private infoUserEzV4: InfoUserEzV4;
  constructor(@inject(InfoUserEzV4) infoUserEzV4: InfoUserEzV4) {
    this.infoUserEzV4 = infoUserEzV4;
  }
  @Get("/")
  async getInfoUser(@Req() request: Request, @Res() response: Response) {
    try {
      const { code } = request.query;
      console.log(code);
      const data = await this.infoUserEzV4.getFullInfoUserFromCode(code as string);
      return response.status(200).json({
        code: 200,
        status: "Success",
        message: "Get info user success",
        data: data
      });
    } catch (error) {
      return response.status(500).json({
        code: 500,
        status: "Error",
        message: "Failed to get info user",
        data: null
      });
    }
  }
}
