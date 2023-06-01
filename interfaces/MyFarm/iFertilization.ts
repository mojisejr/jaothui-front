export interface Fertilization {
  id?: number;
  buffaloId: number;
  ovulation: Date;
  preg?: Date;
  end?: Date;
  done: boolean;
}
