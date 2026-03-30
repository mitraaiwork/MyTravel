"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Generation is now handled inline on the trip page.
// This route redirects immediately so any old bookmarks still work.
export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/trips/${params.id}`);
  }, [params.id, router]);

  return null;
}
