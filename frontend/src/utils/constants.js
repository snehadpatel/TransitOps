export const STATUS_COLORS = {
  AVAILABLE:  'available',
  ON_TRIP:    'on_trip',
  IN_SHOP:    'in_shop',
  RETIRED:    'retired',
  SUSPENDED:  'suspended',
  OFF_DUTY:   'off_duty',
  DRAFT:      'draft',
  DISPATCHED: 'dispatched',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
  ACTIVE:     'active',
  CLOSED:     'closed',
};

export const VEHICLE_TYPES = ['VAN', 'TRUCK', 'BUS', 'MOTORCYCLE', 'OTHER'];

export const ROLES = {
  FLEET_MANAGER:    'Fleet Manager',
  DISPATCHER:       'Dispatcher',
  SAFETY_OFFICER:   'Safety Officer',
  FINANCIAL_ANALYST:'Financial Analyst',
};

// RBAC matrix — what each role can do
export const RBAC = {
  FLEET_MANAGER: {
    vehicles: 'edit',
    drivers: 'view',
    trips: 'view',
    fuel: 'none',
    analytics: 'none',
    maintenance: 'edit',
    settings: 'edit',
  },
  DISPATCHER: {
    vehicles: 'view',
    drivers: 'view',
    trips: 'edit',
    fuel: 'none',
    analytics: 'view',
    maintenance: 'view',
    settings: 'view',
  },
  SAFETY_OFFICER: {
    vehicles: 'view',
    drivers: 'edit',
    trips: 'view',
    fuel: 'none',
    analytics: 'view',
    maintenance: 'view',
    settings: 'view',
  },
  FINANCIAL_ANALYST: {
    vehicles: 'view',
    drivers: 'none',
    trips: 'none',
    fuel: 'edit',
    analytics: 'view',
    maintenance: 'view',
    settings: 'view',
  },
};

export const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',        path: '/dashboard',    icon: 'grid',       roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { key: 'fleet',        label: 'Fleet',             path: '/fleet',        icon: 'truck',      roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { key: 'drivers',      label: 'Drivers',           path: '/drivers',      icon: 'user',       roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { key: 'trips',        label: 'Trips',             path: '/trips',        icon: 'map',        roles: ['DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'FLEET_MANAGER'] },
  { key: 'maintenance',  label: 'Maintenance',       path: '/maintenance',  icon: 'tool',       roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { key: 'fuel',         label: 'Fuel & Expenses',   path: '/fuel',         icon: 'dollar',     roles: ['FINANCIAL_ANALYST', 'FLEET_MANAGER'] },
  { key: 'analytics',   label: 'Analytics',          path: '/analytics',    icon: 'bar-chart',  roles: ['FINANCIAL_ANALYST', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { key: 'settings',    label: 'Settings',            path: '/settings',     icon: 'settings',   roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
];
