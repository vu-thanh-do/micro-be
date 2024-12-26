import { Document } from "mongoose";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";

export interface IGenericService<T extends Document> {
    create(model: T, uow: UnitOfWork, sessionStart: any): Promise<T>;
    getAll(): Promise<T[]>;
    getById(id: string): Promise<T | null>;
    update(id: string, data: Partial<T>, uow?: UnitOfWork): Promise<T | null>;
    delete(id: string): Promise<boolean>;
  }