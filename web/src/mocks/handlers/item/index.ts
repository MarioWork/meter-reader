import addItemHandler from './addItem.mock.handler';
import listItemsHandler from './listItems.mock.handler';

export const itemMockHandlers = (baseUrl: string) => [...listItemsHandler(baseUrl), ...addItemHandler(baseUrl)];
