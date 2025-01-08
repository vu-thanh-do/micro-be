import { IGenericService } from "./../interface/iGenericService";
import { INoti } from "../../types/noti.type";
import Notification from "../../models/models-project/notification.model";
import { NotiRepository } from "../../repositories/noti.repository";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { Document } from "mongoose";
export class GenericService<T extends Document> implements IGenericService<T> {
  private repository: any;
  constructor(repository: any) {
    this.repository = repository;
  }
  async create(model: T, uow: UnitOfWork, sessionStart: any): Promise<T> {
    try {
      const repo = uow.registerRepository(this.repository);
      const result = await repo.create(model, sessionStart);
      return result as T;
    } catch (error) {
      console.error("Error creating document:", error);
      throw new Error("Error creating document");
    }
  }
  async getAll(): Promise<T[]> {
    const data = await this.repository.find({});
    return data
  }
  async getById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }
  async update(
    id: string,
    data: Partial<T>,
    uow?: UnitOfWork
  ): Promise<T | null> {
    try {
      let repo;
      if (uow) {
        repo = uow.registerRepository(this.repository);
        const updatedEntity = await repo.update(id, data);
        return updatedEntity as T;
      } else {
        const updatedEntity = await this.repository.updateById(id, data);
        return updatedEntity as T;
      }
    } catch (error) {
      console.error("Error updating document:", error);
      throw new Error("Error updating document");
    }
  }
  async delete(id: string): Promise<boolean> {
    return this.repository.deleteById(id);
  }
}
