import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth: Login
  http.post('*/api/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'fake-jwt-token',
      user: { id: 'admin-id', name: 'Admin User', role: 'ADMIN' }
    });
  }),

  // Items: Get List
  http.get('*/api/items', () => {
    return HttpResponse.json({
      items: [{ id: '1', title: 'Test Phone', status: 'FOUND', category: 'OTHER', location: 'LIBRARY' }],
      pagination: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10 }
    });
  }),

  // Users: Delete User (Fixes the 404 in userController test)
  http.delete('*/api/users/:id', ({ params }) => {
    return HttpResponse.json({ message: `User ${params.id} deleted successfully` }, { status: 200 });
  }),

  // Users: Get List
  http.get('*/api/users', () => {
    return HttpResponse.json([{ id: '1', name: 'User One', role: 'USER' }]);
  })
];