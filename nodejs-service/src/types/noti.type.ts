import { Document } from "mongoose";

export interface INoti extends Document {
  title: string;
  content: string;
  type: string;
  userId: string;
  role: string;
  requestId: string;
  requestType: string;
  isRead: boolean;
  metadata: {
    requestTitle?: string;
    requesterName?: string;
    requesterCode?: string;
    approvalLevel?: number;
    actionBy?: {
      name: string;
      code: string;
    };
    link?: string;
  };
}

export interface INotificationData {
  title: string;
  content: string;
  type: string;
  userId: string;
  role: "USER";
  requestId: string;
  requestType: "MFG" | "DEPARTMENT" | "OTHER";
  isRead: boolean;
  metadata: {
    requestTitle: string;
    requesterName: string;
    requesterCode: string;
    approvalLevel: number;
    actionBy: {
      name: string;
      code: string;
    };
    link: string;
  };
}
