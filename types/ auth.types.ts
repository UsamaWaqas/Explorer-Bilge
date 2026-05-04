export interface User {
  id: number;
  Xnid: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role_type_id: number;
  company_id: number;
  domain_id: number;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  residence_customer: number;
  title: string;
  has_marina: boolean;
}

export interface UserDetail {
  id: number;
  user_id: number;
  phone_number: number;
  phone_type: string | null;
  notification_phone: string;
  notification_email: string;
  manager_phone: string | null;
  manager_email: string | null;
  address_1: string;
  address_2: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
  container_id: string | null;
  inventory_device_id: string | null;
  dealer_id: string | null;
  email_notification: boolean;
  phone_notification: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  userDetail: UserDetail | null;
  loading: boolean;

  login: (params: {
    token: string;
    user: User;
    userDetail: UserDetail;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setUserDetail: (detail: Partial<UserDetail>) => Promise<void>;
}