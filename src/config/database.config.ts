import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  path: process.env.DB_PATH || './database/cars.db',
}));
