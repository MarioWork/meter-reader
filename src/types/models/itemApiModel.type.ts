export interface ItemApiModel {
  id: number;
  name: string;
  creationDate: string;
}

export type ItemId = ItemApiModel['id'];
