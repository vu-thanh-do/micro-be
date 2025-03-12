import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMasterData } from "../../types/masterData.type";
import { ILanguage } from "../../types/language.type";
import { ObjectId } from "mongodb";

interface IMfgRecruitmentRequest extends Document {
    _id: ObjectId;
    year: number;
    month: number;
    requestByLine: {
        lineId: ObjectId;
        requestByLineId: ObjectId;
        requestByLineName: string;
        requestByLineCode: string;
        requestByLineStatus: boolean;
        requestByLineCreatedAt: Date;
        requestByLineUpdatedAt: Date;
    }[];
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

    const MfgRecruitmentRequestSchema = new mongoose.Schema(
    {
        _id: ObjectId,
        year: Number,
        month: Number,
        requestByLine: [
            {
                lineId: ObjectId,
                requestByLineId: ObjectId,
                requestByLineName: String,
                requestByLineCode: String,
                requestByLineStatus: Boolean,
                requestByLineCreatedAt: Date,
                requestByLineUpdatedAt: Date
            }
        ],
        status: Boolean,
        createdAt: Date,
        updatedAt: Date
    },
    {
        timestamps: true,
        versionKey: false,
    }
);
MfgRecruitmentRequestSchema.plugin(mongoosePaginate);
interface MfgRecruitmentRequestModel<T extends Document> extends PaginateModel<T> {}      
const MfgRecruitmentRequest = mongoose.model<IMfgRecruitmentRequest, MfgRecruitmentRequestModel<IMfgRecruitmentRequest>>("MfgRecruitmentRequest", MfgRecruitmentRequestSchema);
// export default MfgRecruitmentRequest;
// {
//     _id: ObjectId,
//     nam: Number,
//     thang: Number,
//     phongBan: String,         // Phòng/ban đăng ký yêu cầu
//     nguoiYeuCau: ObjectId,    // Người đăng ký yêu cầu tuyển dụng
//     yeuCauTheoDayChuyen: [
//       {
//         dayChuyenId: ObjectId,  // Tham chiếu đến dây chuyền sản xuất
//         hangMuc: [
//           {
//             hangMucId: String,  // Tham chiếu đến collection HangMucTuyenDung
//             soLuong: Number,    // Số lượng nhân viên cần tuyển
//             viTri: [Number]     // Mảng vị trí/ngày cần tuyển (như trong bảng)
//           }
//         ]
//       }
//     ],
//     tongSoLuongTuyen: Number, // Tổng số lượng cần tuyển
//     yeuCauChung: {            // Yêu cầu chung (như trong form)
//       trinhDo: String,        // THCS, THPT, TC, CĐ, ĐH
//       doTuoi: String,
//       gioiTinh: String,
//       // Các yêu cầu khác
//     },
//     trangThai: String,        // "Đã đăng ký", "Đang xử lý", "Đã duyệt", "Hoàn thành"
//     ngayTao: Date,
//     ngayCapNhat: Date,
//     ghiChu: String
//   }