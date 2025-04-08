import mongoose, { Document, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

interface IMfgRecruitmentRequest extends Document {
    year: number;
    month: number;
    recCode: string;
    requestId: mongoose.Types.ObjectId;
    lines: {
        id: mongoose.Types.ObjectId;
        name: string;
        dailyVolume: number;
        standardPerson: number;
        actualEmployeeNumber: number;
        requireNumber: number;
        terminate: number;
        pregnantLeave: number;
        leaveAdjustment: number;
        actualComeBack: number;
    }[];
    movement: number;
    requireNumberAllLine: number;
    remainLastMonth: number;
    totalRequire: number;
    levelApproval: {
        Id: number;
        level: number;
        EmployeeId: string;
        EmployeeName: string;
    }[];
    conclusion: {
        total: {
            official: number;
            outsource: number;
            student: number;
        };
        education: string;
        age: string;
        gender: string;
        physicalCondition: {
            male: {
                height: number;
                weight: number;
            };
            female: {
                height: number;
                weight: number;
            };
        };
        enterDate: {
            enterDate: Date;
            quantity: number;
        }[];
    };
    total: {
        dailyVolume: number;
        standardPerson: number;
        actualEmployeeNumber: number;
        movement: number;
        terminate: number;
        pregnantLeave: number;
        leaveAdjustment: number;
        requireNumber: number;
        requireNumberForAllLine: number;
        actualComeBack: number;
        remainLastMonth: number;
        totalRequire: number;
    };
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const MfgRecruitmentRequestSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: "RequestRecruitment" },
        year: { type: Number, required: true },
        month: { type: Number, required: true },
        recCode: { type: String, default: "" },
        lines: [{
            id: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            dailyVolume: { type: Number, required: true },
            standardPerson: { type: Number, required: true },
            actualEmployeeNumber: { type: Number, required: true },
            requireNumber: { type: Number, required: true },
            terminate: { type: Number, required: true },
            pregnantLeave: { type: Number, required: true },
            leaveAdjustment: { type: Number, required: true },
            actualComeBack: { type: Number, required: true }
        }],
        movement: { type: Number, required: true },
        requireNumberAllLine: { type: Number, required: true },
        remainLastMonth: { type: Number, required: true },
        totalRequire: { type: Number, required: true },
        levelApproval: [{
            Id: { type: Number, required: true },
            level: { type: Number, required: true },
            EmployeeId: { type: String, default: "" },
            EmployeeName: { type: String, default: "" }
        }],
        conclusion: {
            total: {
                official: { type: Number, required: true },
                outsource: { type: Number, required: true },
                student: { type: Number, required: true }
            },
            education: { type: String, required: true },
            age: { type: String, required: true },
            gender: { type: String, required: true },
            physicalCondition: {
                male: {
                    height: { type: Number, required: true },
                    weight: { type: Number, required: true }
                },
                female: {
                    height: { type: Number, required: true },
                    weight: { type: Number, required: true }
                }
            },
            enterDate: [{
                enterDate: { type: Date, required: true },
                quantity: { type: Number, required: true }
            }]
        },
        total: {
            dailyVolume: { type: Number, required: true },
            standardPerson: { type: Number, required: true },
            actualEmployeeNumber: { type: Number, required: true },
            movement: { type: Number, required: true },
            terminate: { type: Number, required: true },
            pregnantLeave: { type: Number, required: true },
            leaveAdjustment: { type: Number, required: true },
            requireNumber: { type: Number, required: true },
            requireNumberForAllLine: { type: Number, required: true },
            actualComeBack: { type: Number, required: true },
            remainLastMonth: { type: Number, required: true },
            totalRequire: { type: Number, required: true }
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);
MfgRecruitmentRequestSchema.plugin(mongoosePaginate);
const MfgRecruitmentRequest = mongoose.model<IMfgRecruitmentRequest, PaginateModel<IMfgRecruitmentRequest>>(
    "MfgRecruitmentRequest", 
    MfgRecruitmentRequestSchema
);
export default MfgRecruitmentRequest;