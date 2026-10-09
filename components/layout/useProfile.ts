"use client";
import { useEffect, useState } from "react";
import { PROFILE_EVENT, PROFILE_KEY, clearProfile, readProfile, type Profile } from "@/components/account/storage";

/** Perfil demo salvo pelo login. Lido só após a montagem (sem divergência de hidratação). */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    const sync = () => setProfile(readProfile());
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === PROFILE_KEY) sync();
    };
    window.addEventListener(PROFILE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return { profile, signOut: clearProfile };
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
