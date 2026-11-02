// A photo of the meter, kept by the API once uploaded. Saving a reading with its id links the two.
export interface PhotoApiModel {
  id: number;
  createdAt: string;
}

export type PhotoId = PhotoApiModel['id'];
