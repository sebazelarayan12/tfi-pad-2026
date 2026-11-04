import type { ApiClient } from '../client';
import type { LoginRequest, LoginResponse } from '../dto/auth';

export function loginRequest(cliente: ApiClient, body: LoginRequest): Promise<LoginResponse> {
  return cliente.post<LoginResponse>('/api/auth/login', body);
}
