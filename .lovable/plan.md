

## Implement User Authentication (Signup, Login, Profiles)

### Database

**Migration 1 — `profiles` table**
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
```

**Migration 2 — Auto-create profile on signup (trigger)**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### New Files

| File | Purpose |
|---|---|
| `src/contexts/AuthContext.tsx` | Auth provider with `onAuthStateChange` listener, `signUp`, `signIn`, `signOut`, profile fetch. Exposes `user`, `profile`, `loading`, auth methods via context. |
| `src/pages/Login.tsx` | Email + password login form. Links to `/signup` and forgot password. Redirects to `/dashboard` on success. Dark theme, matches app style. |
| `src/pages/Signup.tsx` | Email + password + display name signup form. Passes `display_name` in `options.data`. Redirects to `/dashboard` or shows email confirmation message. |
| `src/components/ProtectedRoute.tsx` | Wraps children; redirects to `/login` if not authenticated. Shows loading spinner while checking. |

### Modified Files

| File | Change |
|---|---|
| `src/App.tsx` | Wrap routes in `AuthProvider`. Add `/login` and `/signup` routes (public). Wrap `AppLayout` route in `ProtectedRoute`. |
| `src/components/AppSidebar.tsx` | Add logout button at the bottom using `useAuth().signOut`. |
| `src/components/AppLayout.tsx` | Optionally display user name in header from auth context. |

### Auth Flow

1. User visits `/signup` → fills form → `supabase.auth.signUp({ email, password, options: { data: { display_name } } })` → trigger creates profile row → redirect to `/dashboard`
2. User visits `/login` → fills form → `supabase.auth.signInWithPassword(...)` → redirect to `/dashboard`
3. `AuthProvider` listens to `onAuthStateChange`, fetches profile from `profiles` table
4. `ProtectedRoute` checks auth state before rendering app routes
5. Sidebar shows logout button → calls `supabase.auth.signOut()` → redirects to `/`

### Design

Login/Signup pages: centered card on dark background, neon accent for primary buttons, consistent with current landing page style. No heavy redesign.

