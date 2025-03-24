import { JsonController, Post, Body, Res, HttpCode } from "routing-controllers";
import { Response } from "express";
import Language from "../../../models/models-project/language.model";
import { TYPES } from "tedious/lib/data-type";
import ResignInfoEzv4 from "../../../services/service-Ezv4/resign";
import { inject } from "inversify";
interface ResignData {
    dept: string;
    info: {
        _id: string;
        code: string;
        name: string;
        division: string;
        section: string;
        position: string;
        grade: string;
        entryDate: string;
        actualLeaveDate: string;
        note: string;
    }[];
}

interface ResignDocument {
    _id: string;
    group: string;
    key: string;
    data: ResignData;
    createdAt: string;
    updatedAt: string;
}

@JsonController("/resign")
export class ResignController {
    private resignInfoEzv4: ResignInfoEzv4;
    constructor(
        @inject(ResignInfoEzv4) resignInfoEzv4: ResignInfoEzv4
    ) {
        this.resignInfoEzv4 = resignInfoEzv4;
    }
    @Post("/getInfoResign")
    @HttpCode(200)
    async getInfoResign(@Body() data: any, @Res() response: Response) {
        try {
            const infoResignSpecific = await Language.findOne({ group: "resign", key: `resign-${data.deptName}` }) as ResignDocument | null;
            const arrEmployeeInfo = infoResignSpecific?.data?.info ?? [];
            const dataEzv4 = await this.resignInfoEzv4.getResignInfo(data.dept);
            return response.status(200).json({
                status: 200,
                message: "thành công",
                data: {
                   specificInfo: arrEmployeeInfo,
                    infoEzv4: dataEzv4.data
                },
            });
        } catch (error: any) {
            console.error("Error in getInfoResign:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc",
                error: error.message,
            });
        }
    }
}
