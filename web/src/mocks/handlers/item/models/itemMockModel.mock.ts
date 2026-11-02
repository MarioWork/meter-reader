import type { ItemApiModel } from '@app-types/models';

const ITEM_NAMES = ['Notebook', 'Ballpoint pen', 'Stapler', 'Desk lamp', 'Monitor stand', 'Paper clips'];

// Fixed, so every run serves the same rows and tests can assert them.
const FIRST_CREATION_DATE = Date.UTC(2026, 0, 5, 9, 30);
const DAY_MS = 1000 * 60 * 60 * 24;

// More than one page, so paging can be seen working.
export const ITEM_MOCK_COUNT = 25;

export const createItemMockModel = (overrides?: Partial<ItemApiModel>): ItemApiModel => ({
  id: 1,
  name: 'Notebook',
  creationDate: new Date(FIRST_CREATION_DATE).toISOString(),
  ...overrides,
});

export const createItemMockModelList = (length: number, overrides?: Partial<ItemApiModel>): ItemApiModel[] =>
  Array.from({ length }, (_, index) =>
    createItemMockModel({
      id: index + 1,
      name: `${ITEM_NAMES[index % ITEM_NAMES.length]} ${index + 1}`,
      creationDate: new Date(FIRST_CREATION_DATE + index * DAY_MS).toISOString(),
      ...overrides,
    }),
  );
