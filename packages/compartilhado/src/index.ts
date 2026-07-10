// Entrada "server-safe": enums, tipos e esquemas Zod, sem nenhuma dependência de React/JSX.
// Componentes React ficam em '@jconv/compartilhado/componentes' — import separado, para não
// forçar o apps/api (NestJS) a lidar com JSX só para reaproveitar um enum ou schema.
export * from './enums';
export * from './tipos';
export * from './esquemas';
