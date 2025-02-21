import { Painting } from '../../entities/painting.entity';

export interface WeeklyArtWorkSet {
  dataName: string;
  data: WeeklyArtWork[];
}

interface WeeklyArtWork {
  id: string;
  type: string;
  cldId: string;
  operationDescription: string;
  painting: Painting;
  aspectRatio: string[];
}
