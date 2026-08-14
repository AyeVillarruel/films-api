import dataSource from './data-source';

dataSource
  .initialize()
  .then(() => dataSource.undoLastMigration())
  .then(() => {
    console.log('Última migración revertida');
    return dataSource.destroy();
  })
  .catch((error) => {
    console.error('Error al revertir migración:', error);
    process.exit(1);
  });
