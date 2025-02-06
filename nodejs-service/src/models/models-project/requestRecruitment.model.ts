import mongoose from "mongoose";

const RequireDataSchema = new mongoose.Schema(
  {
    userRequest: {
      type: String,
    },
    nameForm: {
      type: Object,
    },
    codeApproval: [],
    status : {
        type: String,
    },
    data :{
        type: Object,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);