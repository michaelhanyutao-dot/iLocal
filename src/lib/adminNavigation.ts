export const getAdminBasePath = (pathname: string) => (pathname.startsWith('/dashboard') ? '/dashboard' : '/admin');
