import mongoose, { ClientSession, Document, Model } from "mongoose";
import { Repository } from "../repositories/repository";
import { injectable } from "inversify";
@injectable()
export class UnitOfWork {
  private session: ClientSession | null = null;
  private repositories: Repository<any>[] = [];
  // Bắt đầu một transaction mới
  public async start(): Promise<ClientSession> {
    console.log("Starting transaction...");
    if (this.session) {
      throw new Error("Transaction already started");
    }
    this.session = await mongoose.startSession();
    this.session.startTransaction();
    return this.session; 
  }

  // Thêm repository vào UnitOfWork
  public registerRepository<T extends Document>(
    model: Model<T>
  ): Repository<T> {
    const repo = new Repository<T>(model, this.session);
    this.repositories.push(repo);
    return repo;
  }

  // Commit các thay đổi
  public async commit(): Promise<void> {
    console.log("Committing transaction...");
    if (!this.session) {
      throw new Error("No transaction started");
    }
    try {
      await this.session.commitTransaction();
    } catch (error) {
      await this.rollback();
      throw error;
    } finally {
      this.session.endSession();
      this.session = null;
    }
  }
  // Rollback các thay đổi
  public async rollback(): Promise<void> {
    console.log("Rolling back transaction...");
    if (!this.session) {
      throw new Error("No transaction started");
    }
    await this.session.abortTransaction();
    this.session.endSession();
    this.session = null;
  }
  // Lấy session để dùng trong các repository
  public getSession(): ClientSession | null {
    return this.session;
  }
}
