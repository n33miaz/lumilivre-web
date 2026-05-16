export const routeOrder = [
  '/admin/dashboard',
  '/admin/books',
  '/admin/students',
  '/admin/loans',
  '/admin/theses',
  '/admin/ranking',
  '/admin/reports',
  '/admin/settings',
];

export const getRouteIndex = (path: string) => {
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/' || cleanPath === '/admin') return 0;

  const index = routeOrder.indexOf(cleanPath);
  return index === -1 ? 0 : index;
};
