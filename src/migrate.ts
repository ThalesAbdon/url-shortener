import dataSource from './data-source';

dataSource
  .initialize()
  .then(() => dataSource.runMigrations())
  .then(() => {
    console.log('Migrations ran successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });