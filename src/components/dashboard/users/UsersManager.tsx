"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { UserPlus, Search, RefreshCw, Mail, Trash2, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { createUserSchema, type CreateUserInput } from "@/validations/user.schema";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PaginationMeta, SafeStaff } from "@/types";

interface RoleOption {
  _id: string;
  name: string;
  slug: string;
}

interface ManagerProps {
  initialItems: SafeStaff[];
  initialMeta: PaginationMeta;
  roles: RoleOption[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string;
}

const ROLE_TONES: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  clinic_owner: "success",
  dentist: "default",
  receptionist: "default",
  accountant: "warning",
  lab_technician: "neutral",
  dental_assistant: "neutral",
};

const STATUS_TONES: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  invited: "warning",
  pending: "warning",
  suspended: "danger",
};

export function UsersManager({ initialItems, initialMeta, roles, canCreate, canUpdate, canDelete, currentUserId }: ManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SafeStaff | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter) params.set("role", roleFilter);

    apiGet<{ items: SafeStaff[]; meta: PaginationMeta }>(`/api/users?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, roleFilter, refreshKey]);

  const reload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const roleName = (user: SafeStaff) => {
    const match = roles.find((r) => r._id === user.roleId);
    return match?.name ?? user.roleName ?? user.role ?? "—";
  };

  const canEditUser = (user: SafeStaff) =>
    canUpdate && user.id !== currentUserId && user.role !== "clinic_owner" && !user.isPlatform;

  const canDeleteUser = (user: SafeStaff) =>
    canDelete && user.id !== currentUserId && user.role !== "clinic_owner" && !user.isPlatform;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Invite staff and manage their access.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="size-4" />
            Invite user
          </Button>
        )}
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <Select
            className="w-44"
            placeholder="All roles"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={roles.map((r) => ({ value: r.slug, label: r.name }))}
          />
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-5 py-3 text-slate-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone={ROLE_TONES[user.role ?? ""] ?? "neutral"}>{roleName(user)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONES[user.status] ?? "neutral"}>{user.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === "invited" && canUpdate && (
                        <ResendButton userId={user.id} onDone={reload} />
                      )}
                      {canEditUser(user) && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(user)}>
                          Edit
                        </Button>
                      )}
                      {canDeleteUser(user) && (
                        <DeleteButton user={user} onDone={reload} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No users found{search ? ` for “${search}”` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} users
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => p - 1); setLoading(true); }}>
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => { setPage((p) => p + 1); setLoading(true); }}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setPage(1);
            setSearch("");
            setRoleFilter("");
            reload();
          }}
        />
      )}

      {editing && (
        <EditUserModal
          user={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function CreateUserModal({ roles, onClose, onCreated }: { roles: RoleOption[]; onClose: () => void; onCreated: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", phone: "", roleId: roles[0]?._id ?? "" },
  });

  const onSubmit = async (values: CreateUserInput) => {
    try {
      await apiPost("/api/users", values);
      toast.success("Invitation sent");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to invite user");
    }
  };

  return (
    <ModalShell title="Invite a team member" subtitle="They&apos;ll receive an email to set their password." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" placeholder="Dr. Nisha Gurung" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" placeholder="staff@clinic.com" error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" type="tel" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register("phone")} />
        <Select
          label="Role"
          options={roles.map((r) => ({ value: r._id, label: r.name }))}
          error={errors.roleId?.message}
          {...register("roleId")}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Mail className="size-4" />
            Send invitation
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({ user, roles, onClose, onSaved }: { user: SafeStaff; roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [roleId, setRoleId] = useState(user.roleId ?? "");
  const [status, setStatus] = useState(user.status === "active" ? "active" : "suspended");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/users/${user.id}`, { name, roleId, status });
      toast.success("User updated");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Edit ${user.name}`} subtitle={user.email} onClose={onClose}>
      <div className="space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          options={roles.map((r) => ({ value: r._id, label: r.name }))}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function ResendButton({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      const result = await apiPost<{ maskedEmail: string }>(`/api/users/${userId}/resend-invite`);
      toast.success(`Invitation resent to ${result.maskedEmail}`);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend invitation");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
      Resend
    </Button>
  );
}

function DeleteButton({ user, onDone }: { user: SafeStaff; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/users/${user.id}`);
      toast.success("User deleted");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
