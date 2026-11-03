import { ApiError, parseHttpError } from './errores';
import { serializarQuery, type Query } from './query';

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export type ResponseType = 'json' | 'text' | 'blob' | 'raw';

export interface RequestOptions<R extends ResponseType = ResponseType> {
  query?: Query;
  signal?: AbortSignal;
  responseType?: R;
}

export interface ApiBlob {
  blob: Blob;
  contentType: string | null;
}

export interface ApiRespuestaCruda {
  status: number;
  ok: boolean;
  contentType: string | null;
  texto: string;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type BodyMethod = Exclude<Method, 'GET'>;
type Results = { text: string; blob: ApiBlob; raw: ApiRespuestaCruda };
type ExplicitResponse<R extends keyof Results> = RequestOptions<R> & { responseType: R };
type MutationArgs = [path: string, body?: unknown];

interface ApiMethod<Args extends MutationArgs> {
  <R extends keyof Results>(...args: [...Args, ExplicitResponse<R>]): Promise<Results[R]>;
  <T = unknown>(...args: [...Args, options?: RequestOptions<'json'>]): Promise<T>;
  (...args: [...Args, options: RequestOptions]): Promise<unknown>;
}

export interface ApiClient {
  get: ApiMethod<[path: string]>;
  post: ApiMethod<MutationArgs>;
  put: ApiMethod<MutationArgs>;
  patch: ApiMethod<MutationArgs>;
  delete: ApiMethod<MutationArgs>;
}

const LOGIN_PATH = '/api/auth/login';
const ACCEPT: Record<ResponseType, string> = {
  json: 'application/json, application/problem+json',
  text: 'text/plain',
  blob: '*/*',
  raw: '*/*',
};

async function readNetwork<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      throw error;
    }
    throw new ApiError({ kind: 'red', status: 0 });
  }
}

function parseJson<T>(text: string, status: number): T {
  try {
    return (text === '' ? undefined : JSON.parse(text)) as T;
  } catch {
    throw new ApiError({ kind: 'respuesta-invalida', status });
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.trim().replace(/\/+$/, '');
  if (!baseUrl) throw new TypeError('baseUrl no puede estar vacía.');

  async function request<T>(
    method: Method,
    path: string,
    body: unknown,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    if (!path.startsWith('/api/')) throw new TypeError('La ruta debe empezar con /api/.');

    const { query, signal, responseType = 'json' } = requestOptions;
    const params = serializarQuery(query);
    const url = `${baseUrl}${path}${params ? `${path.includes('?') ? '&' : '?'}${params}` : ''}`;
    const headers = new Headers({ Accept: ACCEPT[responseType] });
    const token = options.getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const init: RequestInit = { method, headers, credentials: 'omit' };
    if (signal) init.signal = signal;
    if (body instanceof FormData) {
      init.body = body;
    } else if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(body);
    }

    const response = await readNetwork(() => fetch(url, init));
    const { status, ok } = response;
    if (status === 401 && path.split('?', 1)[0] !== LOGIN_PATH) options.onUnauthorized?.();

    const contentType = response.headers.get('content-type');
    if (responseType === 'blob' && ok) {
      const blob = await readNetwork(() => response.blob());
      return { blob, contentType } satisfies ApiBlob as T;
    }

    const texto = status === 204 ? '' : await readNetwork(() => response.text());
    if (responseType === 'raw')
      return { status, ok, contentType, texto } satisfies ApiRespuestaCruda as T;
    if (!ok) throw parseHttpError(status, contentType, texto);
    if (responseType === 'text') return texto as T;
    return parseJson<T>(texto, status);
  }

  const withBody =
    (method: BodyMethod) =>
    <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      request<T>(method, path, body, requestOptions);

  return {
    get: <T>(path: string, requestOptions?: RequestOptions) =>
      request<T>('GET', path, undefined, requestOptions),
    post: withBody('POST'),
    put: withBody('PUT'),
    patch: withBody('PATCH'),
    delete: withBody('DELETE'),
  };
}
