import { config } from "@/lib/config";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 text-center shadow-lg ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You do not have permission to access the {config.brand.name} CRM. 
            If you believe this is an error, please contact your administrator.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            &larr; Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
