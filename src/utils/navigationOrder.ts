export const routeOrder = [
  '/admin/dashboard',
  '/admin/livros',
  '/admin/alunos',
  '/admin/emprestimos',
  '/admin/tcc',
  '/admin/classificacao',
  '/admin/relatorios',
  '/admin/configuracoes',
];

export const getRouteIndex = (path: string) => {
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/' || cleanPath === '/admin') return 0;

  const index = routeOrder.indexOf(cleanPath);
  return index === -1 ? 0 : index;
};
