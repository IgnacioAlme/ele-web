import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, MoodleApiError, setUserPassword } from "@/lib/moodle";

const DNI_RE = /^\d{6,9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
const attempts = new Map<string, number[]>();

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const recent = (attempts.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= RATE_MAX) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);
  return false;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0]?.trim() ?? "unknown";

  let body: { username?: string; email?: string };
  try {
    body = (await request.json()) as { username?: string; email?: string };
  } catch {
    return NextResponse.json({ ok: false, message: "Solicitud inválida." }, { status: 400 });
  }

  const username = String(body.username ?? "").replace(/[.\s]/g, "");
  const email = String(body.email ?? "").trim();

  if (!DNI_RE.test(username)) {
    return NextResponse.json(
      { ok: false, message: "Ingresá el DNI sin puntos ni espacios (solo números)." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Ingresá una dirección de correo electrónico válida." },
      { status: 400 },
    );
  }

  if (tooManyAttempts(`${ip}:${username}`)) {
    return NextResponse.json(
      { ok: false, message: "Demasiados intentos. Esperá unos minutos y volvé a intentar." },
      { status: 429 },
    );
  }

  let user: Awaited<ReturnType<typeof getUserByUsername>>;
  try {
    user = await getUserByUsername(username);
  } catch (err) {
    console.error("[reset] error consultando el usuario en Moodle:", err);
    return NextResponse.json(
      { ok: false, message: "El servicio no está disponible en este momento. Intentá de nuevo más tarde." },
      { status: 503 },
    );
  }

  if (!user || normalizeEmail(user.email) !== normalizeEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "El DNI y el correo electrónico no coinciden con nuestros registros." },
      { status: 404 },
    );
  }

  try {
    await setUserPassword(user.id, username);
  } catch (err) {
    console.error(`[reset] error al resetear contraseña de ${username}:`, err);
    if (err instanceof MoodleApiError && err.code === "missing-token") {
      return NextResponse.json(
        { ok: false, message: "El servicio no está disponible en este momento. Intentá de nuevo más tarde." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No se pudo completar el reseteo. Intentá de nuevo más tarde." },
      { status: 500 },
    );
  }

  console.info(`[reset] contraseña reseteada de ${username} (id=${user.id})`);
  return NextResponse.json({ ok: true, message: "Tu contraseña fue restablecida.", username });
}