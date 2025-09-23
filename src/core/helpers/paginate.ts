/* eslint-disable @typescript-eslint/no-explicit-any */
import { SelectQueryBuilder } from "typeorm";

export const paginate = async <T>(
  queryBuilder: SelectQueryBuilder<T extends object ? T : any> | any,
  page: number,
  limit: number
) => {
  const total = await queryBuilder.length;

  // queryBuilder.skip((page - 1) * limit).take(limit);

  // const data = await queryBuilder.getMany();

  let totalPages = limit ? Math.ceil(total / limit) : 1;
  const previousPage = page - 1 > 0 ? page - 1 : null;
  const nextPage = totalPages && page < totalPages ? page + 1 : null;

  totalPages = total < 1 ? 0 : totalPages;
  // return {
  //   data,
  //   meta: { total, totalPages, currentPage: page, previousPage, nextPage },
  // };
  console.log(total, totalPages, page, previousPage, nextPage);
  return { total, totalPages, currentPage: page, previousPage, nextPage };
};
