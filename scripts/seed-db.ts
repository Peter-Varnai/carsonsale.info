import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import Database from 'better-sqlite3';

interface CarRecord {
  date_of_manufacturing: string;
  engine_power: string;
  fuel_type: string;
  latitude_coordinates: string;
  longitude_coordinates: string;
  manufacturer: string;
  mileage: string;
  price: string;
  seller_country_code: string;
  seller_location: string;
}

const dbPath = path.join(process.cwd(), 'database', 'cars.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_of_manufacturing INTEGER,
    engine_power INTEGER,
    fuel_type TEXT,
    latitude_coordinates REAL,
    longitude_coordinates REAL,
    manufacturer TEXT,
    mileage INTEGER,
    price INTEGER,
    seller_country_code TEXT,
    seller_location TEXT
  )
`);

const countStmt = db.prepare('SELECT COUNT(*) as count FROM cars');
const result = countStmt.get() as { count: number };
if (result.count > 0) {
  console.log(
    `Database already contains ${result.count} records. Skipping seed.`,
  );
  db.close();
  process.exit(0);
}

const csvPath = path.join(process.cwd(), 'src', 'cars_on_sale.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const parsed = Papa.parse<CarRecord>(csvContent, {
  header: true,
  skipEmptyLines: true,
});

const insertStmt = db.prepare(`
  INSERT INTO cars (
    date_of_manufacturing,
    engine_power,
    fuel_type,
    latitude_coordinates,
    longitude_coordinates,
    manufacturer,
    mileage,
    price,
    seller_country_code,
    seller_location
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let skippedCount = 0;

const insertMany = db.transaction((cars: CarRecord[]) => {
  for (const car of cars) {
    if (
      !car.latitude_coordinates ||
      !car.longitude_coordinates ||
      !car.manufacturer
    ) {
      skippedCount++;
      continue;
    }
    insertStmt.run(
      parseInt(car.date_of_manufacturing, 10),
      parseInt(car.engine_power, 10),
      car.fuel_type,
      parseFloat(car.latitude_coordinates),
      parseFloat(car.longitude_coordinates),
      car.manufacturer,
      parseInt(car.mileage, 10),
      parseInt(car.price, 10),
      car.seller_country_code,
      car.seller_location,
    );
  }
});

insertMany(parsed.data);

console.log(
  `Seeded ${parsed.data.length - skippedCount} records into database (skipped ${skippedCount} with missing data).`,
);
db.close();
