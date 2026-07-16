import { Metadata } from "next";
import ProfileClient from "./ProfileClient";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function fetchProfile(userId: string) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;

  const json = await response.json();
  return json.data;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    const profile = await fetchProfile(userId);

    if (!profile) {
      return {
        title: "User Profile",
        description: "View user profile on Mindful AI Sandbox",
      };
    }

    const title = profile.username;
    const description =
      profile.bio || `${profile.username}'s profile on Mindful AI Sandbox`;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/users/${userId}`,
      },
      openGraph: {
        title: `${profile.username} | Mindful AI Sandbox`,
        description,
        type: "profile",
        url: `${SITE_URL}/users/${userId}`,
        ...(profile.avatarUrl && {
          images: [
            { url: profile.avatarUrl, alt: `${profile.username}'s avatar` },
          ],
        }),
      },
      twitter: {
        card: "summary",
        title: `${profile.username} | Mindful AI Sandbox`,
        description,
        ...(profile.avatarUrl && { images: [profile.avatarUrl] }),
      },
    };
  } catch {
    return {
      title: "User Profile",
      description: "View user profile on Mindful AI Sandbox",
    };
  }
}

export default async function ProfilePage() {
  return <ProfileClient />;
}
