"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { profileAPI } from "@/lib/api/endpoints/profile";
import type { UserProfile } from "@/types/api.types";

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      // Wait for auth to finish loading before checking authentication
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      try {
        const data = await profileAPI.getMyProfile();
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, authLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <main
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
        data-testid="profile-loading"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 w-24 rounded-full bg-gray-200"></div>
            <div className="h-6 w-1/3 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-4 text-red-600">
            {error || "Failed to load profile"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-red-700 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      data-testid="profile-page"
    >
      {/* Page Header */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        My Profile
      </h1>

      {/* Profile Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Avatar and Basic Info */}
        <div className="mb-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.username}'s avatar`}
                className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
                <span className="text-3xl font-semibold text-blue-600">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {profile.username}
            </h2>
            <p className="mb-3 text-sm text-gray-500">{profile.email}</p>

            {/* Role Badge */}
            <span
              data-testid="profile-role-badge"
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                profile.role === "Admin"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              Role: {profile.role}
            </span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6 border-b border-gray-200 pb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Bio</h3>
            <p className="whitespace-pre-wrap text-gray-600">{profile.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Edit Profile Button */}
          <button
            data-testid="edit-profile-button"
            onClick={() => router.push("/settings")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit profile
          </button>
        </div>
      </div>
    </main>
  );
}
