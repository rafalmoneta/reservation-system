import { Logger, NotFoundException } from '@nestjs/common';
import { AbstractDocument } from './abstract.schema';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<TDocument>) {}

  async create(document: Omit<TDocument, '_id'>): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document, // spreading the document to ensure we don't accidentally override the _id property
      _id: new Types.ObjectId(), // generating the underscore id property for ourself
    });
    return (await createdDocument.save()).toJSON() as unknown as TDocument;
  }

  async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
    const document = await this.model.findOne(filterQuery, {}, { lean: true }); // lean: true to return a plain JS object instead of a mongoose document

    if (!document) {
      this.logger.debug(`No document found for filter query:`, filterQuery);
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ) {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      new: true, // by default findOneAndUpdate returns the document before the update is applied
      lean: true,
    });

    if (!document) {
      this.logger.debug(`No document found for filter query:`, filterQuery);
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    return this.model.find(filterQuery, {}, { lean: true });
  }

  async findOneAndDelete(filterQuery: FilterQuery<TDocument>) {
    return this.model.findOneAndDelete(filterQuery, { lean: true });
  }
}
