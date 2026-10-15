export type ServiceError = {
  code: string;
  message: string;
  field?: string;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(error: ServiceError): Result<T> {
  return { ok: false, error };
}
