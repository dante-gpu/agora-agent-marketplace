import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      set({ user: data.user });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    try {
      set({ loading: true, error: null });

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUser) {
        throw new Error("Username is already taken");
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        try {
          // Create user profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert([
              {
                user_id: authData.user.id,
                username,
              },
            ])
            .single();

          if (profileError) {
            // If profile creation fails, delete the auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
          }

          // Create default user settings
          const { error: settingsError } = await supabase
            .from("user_settings")
            .insert([
              {
                user_id: authData.user.id,
              },
            ])
            .single();

          if (settingsError) {
            // If settings creation fails, clean up
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw settingsError;
          }

          set({ user: authData.user });
        } catch (error) {
          // Clean up on any error
          if (authData.user) {
            await supabase.auth.admin.deleteUser(authData.user.id);
          }
          throw error;
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  initialize: async () => {
    // Added async here
    set({ loading: true, error: null }); // Set initial loading state

    supabase.auth.onAuthStateChange(async (event, session) => {
      // Set loading true at the start of handling an auth event,
      // especially for INITIAL_SESSION or SIGNED_IN which involve async operations.
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        set({ loading: true });
      }

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("user_id") // Check for existence
            .eq("user_id", session.user.id)
            .maybeSingle(); // Avoids error if profile not found (expected for new user)

          if (profileError) {
            throw new Error(`Error fetching profile: ${profileError.message}`);
          }

          if (!profile) {
            // New user: create profile and settings
            const emailParts = session.user.email?.split("@");
            const baseUsername = (emailParts ? emailParts[0] : "user").replace(
              /[^a-zA-Z0-9_-]/g,
              ""
            );
            let username = `${baseUsername}${Date.now().toString().slice(-5)}`; // Use 5 digits for more uniqueness
            let usernameAttempt = 0;
            let usernameIsUnique = false;

            // Attempt to generate a unique username
            while (!usernameIsUnique && usernameAttempt < 10) {
              const { data: existingUser, error: checkError } = await supabase
                .from("user_profiles")
                .select("username")
                .eq("username", username)
                .maybeSingle();

              if (checkError) {
                throw new Error(
                  `Error checking username uniqueness: ${checkError.message}`
                );
              }
              if (!existingUser) {
                usernameIsUnique = true;
              } else {
                username = `${baseUsername}${Date.now()
                  .toString()
                  .slice(-5)}${usernameAttempt}`;
                usernameAttempt++;
              }
            }

            if (!usernameIsUnique) {
              throw new Error(
                "Could not generate a unique username after multiple attempts."
              );
            }

            // Insert new profile
            const { error: insertProfileError } = await supabase
              .from("user_profiles")
              .insert([
                {
                  user_id: session.user.id,
                  username,
                  email: session.user.email, // Store email in profile
                },
              ]);

            if (insertProfileError) {
              throw new Error(
                `Error creating profile: ${insertProfileError.message}`
              );
            }

            // Insert default settings
            const { error: insertSettingsError } = await supabase
              .from("user_settings")
              .insert([{ user_id: session.user.id }]);

            if (insertSettingsError) {
              // If settings creation fails, we might want to clean up the created profile,
              // but for now, just throw, which will lead to sign out.
              throw new Error(
                `Error creating user settings: ${insertSettingsError.message}`
              );
            }
          }
          // Successfully signed in (or profile already existed)
          set({ user: session.user, error: null, loading: false });
        } catch (e) {
          // Handle errors during profile/settings creation
          set({ user: null, error: (e as Error).message, loading: false });
          if (session?.user) {
            // Ensure we only sign out if there was a user session we failed to process
            await supabase.auth.signOut(); // Sign out to prevent inconsistent state
          }
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, error: null, loading: false });
      } else if (event === "USER_UPDATED") {
        set({ user: session?.user ?? null, error: null, loading: false });
      } else if (event === "INITIAL_SESSION" && !session?.user) {
        // Initial session resolved, but no user logged in
        set({ user: null, error: null, loading: false });
      }
      // Other events like TOKEN_REFRESHED, PASSWORD_RECOVERY might not need explicit state changes here
      // unless they affect the user object or loading status.
      // The loading: false is critical for paths that complete an auth flow.
    });
  },
}));
