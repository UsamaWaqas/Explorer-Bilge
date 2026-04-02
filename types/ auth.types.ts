export interface User {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
}

export interface UserDetail {
  phone_notification: boolean;
  email_notification: boolean;
  notification_phone: string | string[];
  notification_email: string | string[];
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  userDetail: UserDetail | null;
  loading: boolean;

  login: (data: {
    token: string;
    refreshToken: string;
    user: User;
  }) => Promise<void>;

  logout: () => Promise<void>;

  initializeAuth: () => Promise<void>;

  setToken: (token: string) => void;

  setUserDetail: (detail: UserDetail) => void;
}