export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}
