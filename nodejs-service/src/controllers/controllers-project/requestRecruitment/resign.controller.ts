import { JsonController, Post, Body, Res, HttpCode, Delete, Param } from "routing-controllers";
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
    
    @Post('/create-resign-specific')
    @HttpCode(200)
    async createResignSpecific(@Body() data: any, @Res() response: Response) {
        try {
            const { deptName, info } = data;
            
            if (!deptName) {
                return response.status(400).json({
                    status: 400,
                    message: "Thiếu thông tin phòng ban (deptName)",
                });
            }
            
            // Kiểm tra dữ liệu đầu vào
            console.log("Controller nhận payload:", JSON.stringify(data));
            
            const result = await this.resignInfoEzv4.createResignSpecific(data);
            console.log("Kết quả từ service:", result.status, result.message);
            
            // Kiểm tra xem dữ liệu đã được lưu thành công chưa
            const verifyData = await Language.findOne({ 
                group: "resign", 
                key: `resign-${deptName}` 
            }) as ResignDocument | null;
            
            console.log("Dữ liệu sau khi lưu:", 
                verifyData ? 
                `ID: ${verifyData._id}, UpdatedAt: ${verifyData.updatedAt}, Info count: ${verifyData.data?.info?.length || 0}` : 
                "Không tìm thấy dữ liệu"
            );
            
            return response.status(result.status).json(result);
        } catch (error: any) {
            console.error("Error in createResignSpecific:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi tạo thông tin nghỉ việc",
                error: error.message,
            });
        }
    }
    
    @Delete('/resign-specific/:deptName/:employeeId')
    @HttpCode(200)
    async deleteResignSpecificEmployee(
        @Param('deptName') deptName: string,
        @Param('employeeId') employeeId: string,
        @Res() response: Response
    ) {
        try {
            const result = await this.resignInfoEzv4.deleteResignSpecificEmployee(deptName, employeeId);
            return response.status(result.status).json(result);
        } catch (error: any) {
            console.error("Error in deleteResignSpecificEmployee:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi xóa thông tin nhân viên nghỉ việc",
                error: error.message,
            });
        }
    }
    
    @Post('/delete-multiple-employees')
    @HttpCode(200)
    async deleteMultipleResignSpecificEmployees(@Body() data: any, @Res() response: Response) {
        try {
            const { deptName, employeeIds } = data;
            
            if (!deptName || !employeeIds || !Array.isArray(employeeIds)) {
                return response.status(400).json({
                    status: 400,
                    message: "Thiếu thông tin phòng ban (deptName) hoặc danh sách nhân viên (employeeIds)",
                });
            }
            
            const result = await this.resignInfoEzv4.deleteMultipleResignSpecificEmployees(deptName, employeeIds);
            return response.status(result.status).json(result);
        } catch (error: any) {
            console.error("Error in deleteMultipleResignSpecificEmployees:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi xóa thông tin nhiều nhân viên nghỉ việc",
                error: error.message,
            });
        }
    }
    
    @Delete('/resign-specific/:deptName')
    @HttpCode(200)
    async deleteResignSpecific(
        @Param('deptName') deptName: string,
        @Res() response: Response
    ) {
        try {
            const result = await this.resignInfoEzv4.deleteResignSpecific(deptName);
            return response.status(result.status).json(result);
        } catch (error: any) {
            console.error("Error in deleteResignSpecific:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi xóa thông tin nghỉ việc đặc biệt",
                error: error.message,
            });
        }
    }
    
    @Post('/get-resign-specific')
    @HttpCode(200)
    async getResignSpecific(@Body() data: any, @Res() response: Response) {
        try {
            const { deptName } = data;
            
            if (!deptName) {
                return response.status(400).json({
                    status: 400,
                    message: "Thiếu thông tin phòng ban (deptName)",
                });
            }
            
            const result = await this.resignInfoEzv4.getResignSpecific(deptName);
            return response.status(result.status).json(result);
        } catch (error: any) {
            console.error("Error in getResignSpecific:", error);
            return response.status(500).json({
                status: 500,
                message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc đặc biệt",
                error: error.message,
            });
        }
    }
}
