import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMasterData } from "../../types/masterData.type";
import { ILanguage } from "../../types/language.type";

interface ILineMfg extends Document {
    nameLine: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    history: { nameLineBefore: string; updatedAt: Date }[];
}
const LineMfgSchema = new mongoose.Schema(
    {
        nameLine: { type: String, required: true },         
        status: { type: Boolean, required: true },       
        createdAt: { type: Date, required: true },
        updatedAt: { type: Date, required: true },
        history: [               
          {
            nameLineBefore: String,
            updatedAt: Date
          }
        ],
    },  
    {
        timestamps: true,
        versionKey: false,
    }
);
LineMfgSchema.plugin(mongoosePaginate);
interface LineMfgModel<T extends Document> extends PaginateModel<T> {}      
const LineMfg = mongoose.model<ILineMfg, LineMfgModel<ILineMfg>>("LineMfg", LineMfgSchema);
export default LineMfg;
