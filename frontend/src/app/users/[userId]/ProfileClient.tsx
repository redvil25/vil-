"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { profileAPI } from "@/lib/api/endpoints/profile";

export default function ProfileClient() {
  const params = useParams();
  const userId = params.userId as string;

  // Fetch public profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profileAPI.getPublicProfile(userId),
    enabled: !!userId,
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            User Not Found
          </h1>
          <p className="mb-4 text-gray-600">
            The user profile you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={`${profile.username}'s avatar`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-medium text-blue-600">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.username}
            </h1>
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
              {profile.role}
            </span>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-gray-600">{profile.bio}</p>}
      </div>
    </div>
  );
}
