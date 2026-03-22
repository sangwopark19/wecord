'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in as admin
    async function checkExisting() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (user && user.user_metadata?.role === 'admin') {
        router.replace('/');
        return;
      }
      setLoading(false);
    }
    checkExisting();

    // Listen for auth state changes (OAuth callback)
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (session.user.user_metadata?.role === 'admin') {
          router.replace('/');
        } else {
          setError('Access denied. Admin role required.');
          await supabaseBrowser.auth.signOut();
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleGoogleSignIn() {
    setError(null);
    const { error: signInError } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login',
      },
    });
    if (signInError) {
      setError(signInError.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-foreground">
          Wecord Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access the admin dashboard
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleGoogleSignIn}
          className="mt-6 w-full bg-[#00E5C3] text-black hover:bg-[#00E5C3]/90"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
