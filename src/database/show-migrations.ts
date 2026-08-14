import dataSource from './data-source';

dataSource
  .initialize()
  .then(async () => {
    const hasPending = await dataSource.showMigrations();

    if (hasPending) {
      console.log('Hay migraciones pendientes por aplicar.');
    } else {
      console.log('Todas las migraciones están aplicadas.');
    }

    const executed = await dataSource.query(
      'SELECT * FROM migrations ORDER BY id',
    );

    console.table(executed);
    return dataSource.destroy();
  })
  .catch((error) => {
    console.error('Error al consultar migraciones:', error);
    process.exit(1);
  });
