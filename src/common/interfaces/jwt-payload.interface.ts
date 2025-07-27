export interface JwtPayload {
  sub: number; // user ID
  userName: string;
  iat?: number;
  exp?: number;
}