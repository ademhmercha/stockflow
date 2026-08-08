import { FilterQuery, Model, Query } from "mongoose";
import { PaginationQuery } from "../validators/pagination.validator";

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryConfigurator = (query: Query<any, any>) => Query<any, any>;

export async function paginateFind<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  { page, limit }: PaginationQuery,
  configure?: QueryConfigurator
): Promise<PaginatedResult<T>> {
  let query = model.find(filter);
  if (configure) query = configure(query);

  const [data, total] = await Promise.all([
    query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
