export type Elem = HTMLElement | Element;

export type Direction = 'x' | 'y';

export type Data = {
  currentDimension: number;
  expanding: boolean;
  hasInteracted: boolean;
  minDimension: number;
  maxDimension: number;
  offset: number;
  prevDimension: number;
  originalCoordinate: number;
  originalPointerCoordinate: number;
  currentPercentage: number;
  snapThreshold: number;
};