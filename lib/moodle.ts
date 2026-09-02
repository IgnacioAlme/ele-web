import "server-only";

const DEFAULT_BASE_URL = "https://ele.chaco.gob.ar";
const TIMEOUT_MS = 30_000;

export type MoodleUser = {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
};

type MoodleErrorEnvelope = {
  error?: string;
  exception?: string;
  errorcode?: string;
  message?: string;
};

export class MoodleApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "MoodleApiError";
    this.code = code;
  }
}

function baseUrl(): string {
  return (process.env.MOODLE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function token(): string {
  const value = process.env.MOODLE_TOKEN;
  if (!value) {
    throw new MoodleApiError("MOODLE_TOKEN no está configurado en el servidor", "missing-token");
  }
  return value;
}

async function call<T>(
  fn: "core_user_get_users_by_field" | "core_user_update_users",
  params: Record<string, string>,
): Promise<T> {
  const body = new URLSearchParams({
    wstoken: token(),
    wsfunction: fn,
    moodlewsrestformat: "json",
    ...params,
  });

  const res = await fetch(`${baseUrl()}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new MoodleApiError(`Moodle respondió HTTP ${res.status}`);
  }

  const raw: unknown = await res.json().catch(() => {
    throw new MoodleApiError("Moodle devolvió una respuesta que no es JSON");
  });

  const error = raw as MoodleErrorEnvelope;
  if (typeof error === "object" && error !== null && (error.error || error.exception || error.message)) {
    throw new MoodleApiError(
      error.message ?? error.error ?? "Error del servicio Moodle",
      error.errorcode,
    );
  }

  return raw as T;
}

export async function getUserByUsername(username: string): Promise<MoodleUser | null> {
  const users = await call<MoodleUser[]>("core_user_get_users_by_field", {
    field: "username",
    "values[0]": username,
  });

  if (!Array.isArray(users) || users.length === 0) {
    return null;
  }
  return users[0];
}

export async function setUserPassword(userId: number, password: string): Promise<void> {
  await call<unknown>("core_user_update_users", {
    "users[0][id]": String(userId),
    "users[0][password]": password,
  });
}