import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Save,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Button, useToast } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { AGE_GROUPS, calculateAge, getAgeGroup } from "../lib/age";
import { supabase } from "../lib/supabase";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function StudentSettings() {
  const { player } = usePlayer();
  const { refreshProfile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: player?.name || "",
    dob: player?.dob || "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      fullName: player?.name || "",
      dob: player?.dob || "",
    });
  }, [player?.name, player?.dob]);

  useEffect(() => {
    let active = true;

    const loadAvatar = async () => {
      if (!supabase || !player?.avatarPath) {
        if (active) setAvatarUrl("");
        return;
      }

      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .createSignedUrl(player.avatarPath, 60 * 60);

      if (!active) return;

      if (error) {
        console.error("Could not load profile picture", error);
        setAvatarUrl("");
        return;
      }

      setAvatarUrl(data?.signedUrl || "");
    };

    loadAvatar();

    return () => {
      active = false;
    };
  }, [player?.avatarPath]);

  const agePreview = useMemo(() => {
    const age = calculateAge(form.dob);
    const group = getAgeGroup(form.dob);
    const info = AGE_GROUPS[group] || AGE_GROUPS.scholar;
    return { age, group, info };
  }, [form.dob]);

  const saveProfile = async () => {
    if (!supabase || !player?.id) return;

    const cleanName = String(form.fullName || "").trim().replace(/\s+/g, " ");
    const age = calculateAge(form.dob);

    if (cleanName.length < 2) {
      toast("Please enter the student's full name.", "error");
      return;
    }

    if (age === null || age < 1) {
      toast("Please enter a valid date of birth.", "error");
      return;
    }

    const ageGroup = getAgeGroup(form.dob);
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          dob: form.dob,
          age_group: ageGroup,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.id);

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          dob: form.dob,
          age_group: ageGroup,
        },
      });

      if (metadataError) {
        console.error("Profile saved, but auth metadata could not be updated", metadataError);
      }

      await refreshProfile(player.id);
      toast("Profile details updated.");
    } catch (error) {
      console.error(error);
      toast(error?.message || "Could not update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file || !player?.id || !supabase) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast("Please choose a JPG, PNG or WebP image.", "error");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast("Profile picture must be smaller than 5 MB.", "error");
      return;
    }

    setAvatarBusy(true);

    try {
      const extension = extensionFor(file);
      const path = `${player.id}/profile-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const previousPath = player.avatarPath || null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.id);

      if (profileError) {
        await supabase.storage.from("profile-pictures").remove([path]);
        throw profileError;
      }

      if (previousPath && previousPath !== path) {
        await supabase.storage
          .from("profile-pictures")
          .remove([previousPath]);
      }

      await refreshProfile(player.id);

      const { data } = await supabase.storage
        .from("profile-pictures")
        .createSignedUrl(path, 60 * 60);
      setAvatarUrl(data?.signedUrl || "");

      toast("Profile picture updated.");
    } catch (error) {
      console.error(error);
      toast(error?.message || "Could not upload profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (!player?.id || !player?.avatarPath || !supabase) return;
    if (!window.confirm("Remove your profile picture?")) return;

    setAvatarBusy(true);

    try {
      const oldPath = player.avatarPath;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.id);

      if (profileError) throw profileError;

      const { error: storageError } = await supabase.storage
        .from("profile-pictures")
        .remove([oldPath]);

      if (storageError) {
        console.error("Profile updated, but old photo could not be removed", storageError);
      }

      setAvatarUrl("");
      await refreshProfile(player.id);
      toast("Profile picture removed.");
    } catch (error) {
      console.error(error);
      toast(error?.message || "Could not remove profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] bg-heritage-forest p-7 text-white sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-100">
            <UserRound className="h-4 w-4" /> Profile settings
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold">
            Manage your profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Update your personal details and profile picture here. Your public
            profile remains clean and view-only.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-heritage-cream ring-4 ring-emerald-100">
              <img
                src={avatarUrl || "/assets/explorer-mobile.jpg"}
                alt={`${player?.name || "Explorer"} profile`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-5 grid gap-2">
              <label
                className={`focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-heritage-green px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 ${
                  avatarBusy ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <Camera className="h-4 w-4" />
                {avatarBusy
                  ? "Uploading…"
                  : player?.avatarPath
                    ? "Change profile picture"
                    : "Add profile picture"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={avatarBusy}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) await uploadAvatar(file);
                    event.target.value = "";
                  }}
                />
              </label>

              {player?.avatarPath && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={avatarBusy}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Remove profile picture
                </button>
              )}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-heritage-green">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Personal details</h2>
                <p className="text-sm text-slate-500">
                  These details are used for your learning profile and age group.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-extrabold text-slate-700">
                  Student name
                </span>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      fullName: e.target.value,
                    }))
                  }
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 outline-none focus:border-heritage-green"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-extrabold text-slate-700">
                  Date of birth
                </span>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      dob: e.target.value,
                    }))
                  }
                  className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 outline-none focus:border-heritage-green"
                />
                <div className="mt-2 text-xs font-semibold text-slate-400">
                  {agePreview.age !== null
                    ? `Age ${agePreview.age} · ${agePreview.info.label} (${agePreview.info.range})`
                    : "Choose a valid date of birth."}
                </div>
              </label>

              <label>
                <span className="mb-2 block text-sm font-extrabold text-slate-700">
                  Registered email
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={player?.email || ""}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-semibold text-slate-500 outline-none"
                  />
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Email stays the same as the account used to register.
                </div>
              </label>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-heritage-green" />
                  <div className="text-sm leading-6 text-slate-600">
                    Changing the date of birth automatically recalculates the
                    student age and question level.
                  </div>
                </div>
              </div>

              <Button
                onClick={saveProfile}
                loading={saving}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" /> Save profile changes
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
