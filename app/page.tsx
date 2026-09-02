import type { Metadata } from "next";
import ResetPasswordForm from "@/app/components/reset-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | ELE Chaco",
  description: "Restablecé tu contraseña ingresando tu DNI y el correo electrónico con el que te registraste.",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <section className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
            Plataforma ELE
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recuperá tu contraseña
          </h1>
          <p className="mt-3 text-base leading-6 text-zinc-600 dark:text-zinc-400">
            Ingresá el DNI con el que iniciás sesión y el correo con el que te
            registraste. Si coinciden, tu contraseña volverá a ser tu DNI.
          </p>
        </header>

        <ResetPasswordForm />

        <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
          Si no podés restablecer tu contraseña, comunicate con la mesa de ayuda
          de tu institución.
        </p>
      </section>
    </main>
  );
}