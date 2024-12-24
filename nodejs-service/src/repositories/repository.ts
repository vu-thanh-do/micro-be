import { ClientSession, Document, Model } from "mongoose";
export class Repository<T extends Document> {
  private model: Model<T>;
  private session: ClientSession | null;

  constructor(model: Model<T>, session: ClientSession | null = null) {
    this.model = model;
    this.session = session;
  }

  async getAll(): Promise<T[]> {
    const data = await this.model.find().session(this.session).exec();
    return data.map(item => item.toObject()) as T[];
  }

  async getById(id: string): Promise<T | null> {
    return this.model.findById(id).session(this.session).exec();
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const entity = new this.model(data);
    return await entity.save({ session });
  }
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, session: this.session })
      .exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).session(this.session).exec();
  }
}
