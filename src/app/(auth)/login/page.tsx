import { config } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string; code?: string };
}) {
  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}`);
  }

  const signIn = async (formData: FormData) => {
    "use server";
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    } else {
      redirect("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-sm border border-[#E8E8E8]">
        <div className="text-center">
          {config.brand.logoUrl && (
            <div className="mx-auto mb-6 h-12 w-auto flex justify-center">
              <img
                src={config.brand.logoUrl}
                alt={`${config.brand.name} Logo`}
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#161616]">
            Sign in to your CRM
          </h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            Welcome back. Please enter your details.
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">
              Authentication Error
            </h3>
            <div className="mt-1 text-sm text-red-700">
              <p>{searchParams.error_description || searchParams.error}</p>
            </div>
          </div>
        )}

        <form action={signIn} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-[#ED711D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D4611A]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
