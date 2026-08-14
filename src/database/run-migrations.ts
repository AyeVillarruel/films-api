import dataSource from './data-source';

dataSource
  .initialize()
  .then(() => dataSource.runMigrations())
  .then(() => {
    console.log('Migraciones aplicadas correctamente');
    return dataSource.destroy();
  })
  .catch((error) => {
    console.error('Error al ejecutar migraciones:', error);
    process.exit(1);
  });
