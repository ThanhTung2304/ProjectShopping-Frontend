export const decodeTokenPayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalizedPayload)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const normalizeRole = (role) => {
  if (!role) return '';
  if (typeof role === 'object') {
    return normalizeRole(role.role || role.name || role.authority);
  }
  return String(role).replace(/^ROLE_/i, '').toLowerCase();
};

export const extractRole = (source) => {
  if (!source) return '';

  if (Array.isArray(source)) {
    return source.map(normalizeRole).find(Boolean) || '';
  }

  const directRole = normalizeRole(source.role || source.authority || source.name);
  if (directRole) return directRole;

  const roleCollections = [
    source.roles,
    source.authorities,
    source.permissions,
    source.user?.roles,
    source.user?.authorities,
    source.data?.roles,
    source.data?.authorities,
  ];

  for (const collection of roleCollections) {
    if (Array.isArray(collection)) {
      const role = collection.map(normalizeRole).find(Boolean);
      if (role) return role;
    }
  }

  return '';
};

export const isAdminRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'administrator';
};

export const isAdminUser = (user) => isAdminRole(extractRole(user));

export const getTokenUser = () => {
  const token = sessionStorage.getItem('token');
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  const role = extractRole(payload) || 'customer';

  return {
    id: payload?.id || payload?.userId || payload?.sub || 'authenticated-user',
    email: payload?.email || payload?.sub || '',
    fullName: payload?.fullName || payload?.name || payload?.sub || 'Tài khoản',
    role,
    roles: payload?.roles || payload?.authorities || undefined,
  };
};

export const buildAuthUser = (authData) => {
  const tokenUser = getTokenUser();
  const responseUser = authData?.user || authData?.account || authData?.profile || null;
  const source = responseUser || authData || tokenUser;
  if (!source) return tokenUser;

  const role = extractRole(source) || extractRole(authData) || tokenUser?.role || 'customer';

  return {
    ...tokenUser,
    ...source,
    id: source.id || source._id || source.userId || tokenUser?.id || 'authenticated-user',
    email: source.email || source.username || tokenUser?.email || '',
    fullName: source.fullName || source.name || source.username || tokenUser?.fullName || 'Tài khoản',
    role,
  };
};
