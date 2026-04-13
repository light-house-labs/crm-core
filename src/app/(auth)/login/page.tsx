import { config } from "@/lib/config";
import Image from "next/image";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string };
}) {
  const signInWithGoogle = async () => {
    "use server";
    
    // In a server action, interact with Supabase
    const supabase = createServerSupabaseClient();
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${protocol}://${host}/auth/callback`,
      },
    });

    if (data.url) {
      redirect(data.url);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        <div className="text-center">
          {config.brand.logoUrl && (
            <div className="mx-auto mb-6 h-12 w-auto flex justify-center">
              {/* Note: Fallback image element because Image component throws if src is fake */}
              <img
                src={config.brand.logoUrl}
                alt={`${config.brand.name} Logo`}
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Sign in to your CRM
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Powered by {config.brand.name}
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Authentication Error
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{searchParams.error_description || searchParams.error}</p>
            </div>
          </div>
        )}

        <form action={signInWithGoogle} className="mt-8 space-y-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
