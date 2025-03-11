import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const RevisionSchema = new mongoose.Schema({
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestRecruitment', required: true },
    revisedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    revisedAt: { type: Date, default: Date.now },
    changes: { type: Map, of: Object, required: true },
    comment: { type: String }
  });

RevisionSchema.plugin(mongoosePaginate);

const Revision = mongoose.model("Revision", RevisionSchema);

export default Revision;

