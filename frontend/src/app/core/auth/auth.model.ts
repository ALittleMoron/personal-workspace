export interface User {
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type AuthState =
  | { status: 'unknown'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User };
