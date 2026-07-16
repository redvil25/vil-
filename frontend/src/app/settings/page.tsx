"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { profileAPI } from "@/lib/api/endpoints/profile";

// Validation schema matching backend validators
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
      message: "Must be a valid URL",
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    checkAuth,
  } = useAuthContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      bio: "",
      avatarUrl: "",
    },
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      // Wait for auth to finish loading before checking authentication
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      try {
        const profile = await profileAPI.getMyProfile();

        setValue("username", profile.username);
        setValue("bio", profile.bio || "");
        setValue("avatarUrl", profile.avatarUrl || "");
      } catch (err) {
        setErrorMessage("Failed to load profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading, router, setValue]);

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await profileAPI.updateMyProfile({
        username: data.username,
        bio: data.bio || undefined,
        avatarUrl: data.avatarUrl || undefined,
      });

      // Refresh auth context to update username in header dropdown
      await checkAuth();

      setSuccessMessage("Profile updated successfully!");

      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        error.response?.data?.error?.message || "Failed to update profile";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch fields for character counters and preview
  const username = useWatch({ control, name: "username" });
  const bio = useWatch({ control, name: "bio" });
  const avatarUrl = useWatch({ control, name: "avatarUrl" });

  // Loading state
  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-1/3 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        Edit Profile
      </h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="username"
                {...register("username")}
                className={`block w-full rounded-md pr-16 shadow-sm sm:text-sm ${
                  errors.username
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="your_username"
              />
              <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                {username?.length || 0} / 20
              </div>
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Letters, numbers, and underscores only. 3-20 characters.
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700"
            >
              Bio (Optional)
            </label>
            <div className="relative mt-1">
              <textarea
                id="bio"
                rows={4}
                {...register("bio")}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.bio
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Tell others about yourself..."
              />
              <div className="absolute bottom-2 right-3 bg-white px-1 text-xs text-gray-400">
                {bio?.length || 0} / 500
              </div>
            </div>
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          {/* Avatar URL Field */}
          <div>
            <label
              htmlFor="avatarUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Avatar URL (Optional)
            </label>
            <input
              type="text"
              id="avatarUrl"
              {...register("avatarUrl")}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.avatarUrl
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatarUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.avatarUrl.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Direct link to your avatar image (HTTPS recommended).
            </p>

            {/* Avatar Preview */}
            {avatarUrl && !errors.avatarUrl && (
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Preview:
                </p>
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              disabled={isSubmitting}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
