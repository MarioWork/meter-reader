// The server side of the web app's list contract (ts-api-services §6): `page` and `size` in, `{ data,
// totalResultNumber, currentPage }` out. A list never answers more than MAX_PAGE_SIZE rows at once.
import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export type SkipTake = { skip: number; take: number };

export function paginatedResponseSchema<Item extends z.ZodType>(itemSchema: Item) {
  return z.object({
    data: z.array(itemSchema),
    totalResultNumber: z.number().int(),
    currentPage: z.number().int(),
  });
}

export function toSkipTake({ page, size }: PaginationQuery): SkipTake {
  return { skip: (page - 1) * size, take: size };
}
