export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
}

export interface HomeResponse {
  'carsonsale.info': string;
}
