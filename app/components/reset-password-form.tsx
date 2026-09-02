"use client";

import { useState, type FormEvent } from "react";

type ApiResponse = { ok: boolean; message: string; username?: string };

export default function ResetPasswordForm() {
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: dni.trim(), email: email.trim() }),
      });
      const data = (await res.json()) as ApiResponse;

      if (res.ok && data.ok) {
        setSuccess({ username: data.username ?? dni.trim() });
        return;
      }
      setError(data.message ?? "Ocurrió un error inesperado.");
    } catch {
      setError("No se pudo conectar con el servicio. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">¡Contraseña restablecida!</p>
        <p className="mt-2 text-base text-emerald-800">
          Tu contraseña volvió a ser tu DNI. Podés ingresar a la plataforma con:
        </p>
        <dl className="mx-auto mt-4 max-w-xs space-y-2 text-left">
          <div className="flex justify-between rounded-lg bg-white px-4 py-2 shadow-sm">
            <dt className="text-sm font-medium text-zinc-500">Usuario</dt>
            <dd className="font-mono text-sm font-semibold text-zinc-900">{success.username}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white px-4 py-2 shadow-sm">
            <dt className="text-sm font-medium text-zinc-500">Contraseña</dt>
            <dd className="font-mono text-sm font-semibold text-zinc-900">{success.username}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-emerald-700">
          Te recomendamos cambiar la contraseña al ingresar por primera vez.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(null);
            setDni("");
            setEmail("");
          }}
          className="mt-6 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          Restablecer otra contraseña
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            DNI (usuario)
          </label>
          <input
            id="username"
            name="username"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            required
            placeholder="18823732"
            value={dni}
            onChange={(event) => setDni(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500">Sin puntos ni espacios.</p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tuemail@ejemplo.com.ar"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500">
            El que usaste al registrarte en la plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Procesando…" : "Restablecer contraseña"}
      </button>
    </form>
  );
}