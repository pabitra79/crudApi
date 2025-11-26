// task.interface.ts
import { Document, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
