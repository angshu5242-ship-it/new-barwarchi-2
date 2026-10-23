import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createStaff,
  deleteStaff,
  listStaff,
  updateStaff,
} from '../utils/staffApi';

const emptyForm = {
  username: '',
  displayName: '',
  phone: '',
  password: '',
  role: 'staff',
};

function formatWhen(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function StaffManager({ adminPassword, onNotice }) {
  const [staff, setStaff] = useState([]);
  const [persisted, setPersisted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError('');
    const result = await listStaff(adminPassword);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'Could not load staff accounts.');
      return;
    }
    setStaff(result.data?.staff || []);
    setPersisted(result.data?.persisted !== false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy('create');
    setError('');
    const result = await createStaff(form, adminPassword);
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not add that staff member.');
      return;
    }
    setForm(emptyForm);
    onNotice?.('success', `${result.data?.staff?.displayName || 'Staff member'} can now sign in at /staff.`);
    load();
  };

  const handleToggle = async (member) => {
    if (busy) return;
    setBusy(member.id);
    setError('');
    const result = await updateStaff(member.id, { active: !member.active }, adminPassword);
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not update that staff member.');
      return;
    }
    onNotice?.('success', `${member.displayName} is now ${member.active ? 'inactive' : 'active'}.`);
    load();
  };

  const handleEdit = async (member) => {
    if (busy) return;
    const displayName = window.prompt('Staff member name', member.displayName);
    if (displayName === null) return;
    const phone = window.prompt(
      'WhatsApp number for order alerts (10 digits, or leave blank)',
      member.phone || '',
    );
    if (phone === null) return;

    setBusy(member.id);
    setError('');
    const result = await updateStaff(
      member.id,
      { displayName, phone, role: member.role },
      adminPassword,
    );
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not update that staff member.');
      return;
    }
    onNotice?.('success', `${result.data?.staff?.displayName || member.displayName} was updated.`);
    load();
  };

  const handleResetPassword = async (member) => {
    if (busy) return;
    const password = window.prompt(`New password for ${member.displayName} (at least 8 characters)`);
    if (password === null) return;
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setBusy(member.id);
    setError('');
    const result = await updateStaff(member.id, { password }, adminPassword);
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not reset that password.');
      return;
    }
    onNotice?.('success', `Password reset for ${member.displayName}.`);
    load();
  };

  const handleRemove = async (member) => {
    if (busy) return;
    if (!window.confirm(`Remove ${member.displayName}? They will no longer be able to sign in or get staff alerts.`)) {
      return;
    }
    setBusy(member.id);
    setError('');
    const result = await deleteStaff(member.id, adminPassword);
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not remove that staff member.');
      return;
    }
    onNotice?.('success', `${member.displayName} was removed.`);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Kitchen team</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Staff access</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Create logins for the staff order screen. Add a WhatsApp number to send that person a
            new-order alert whenever the bot is configured.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/staff" target="_blank" rel="noopener noreferrer" className="btn-secondary px-4 py-2.5 text-sm">
            Open staff screen ↗
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-surface-100 disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-semibold text-sky-900">How staff notifications work</p>
        <p className="mt-1 text-xs leading-relaxed text-sky-800">
          Every active staff member with a WhatsApp number receives the same new-order template as
          the restaurant. The <Link to="/staff" className="font-semibold underline">staff screen</Link>{' '}
          also polls for new orders every 20 seconds and can show browser alerts while it is open.
          WhatsApp alerts require the Cloud API keys and an approved <code>new_order_alert</code> template.
        </p>
      </div>

      {!persisted && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Staff accounts need <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> to be connected.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-display text-xl font-semibold text-gray-900">Add a staff member</h2>
            <p className="mt-1 text-xs text-gray-500">
              They sign in at <code className="rounded bg-surface-100 px-1">/staff</code> with this username and password.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="staff-new-username" className="label">Username</label>
            <input
              id="staff-new-username"
              value={form.username}
              onChange={(event) => updateForm('username', event.target.value)}
              className="input-field mt-1.5 py-2.5 text-sm"
              placeholder="e.g. rahul"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label htmlFor="staff-new-name" className="label">Name</label>
            <input
              id="staff-new-name"
              value={form.displayName}
              onChange={(event) => updateForm('displayName', event.target.value)}
              className="input-field mt-1.5 py-2.5 text-sm"
              placeholder="Rahul Das"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label htmlFor="staff-new-phone" className="label">WhatsApp number</label>
            <input
              id="staff-new-phone"
              value={form.phone}
              onChange={(event) => updateForm('phone', event.target.value)}
              className="input-field mt-1.5 py-2.5 text-sm"
              placeholder="93669 86853"
              inputMode="tel"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="staff-new-password" className="label">Password</label>
            <input
              id="staff-new-password"
              type="password"
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              className="input-field mt-1.5 py-2.5 text-sm"
              placeholder="8+ characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy === 'create'}
              className="btn-primary w-full px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {busy === 'create' ? 'Adding…' : 'Add staff'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Leave the WhatsApp number blank if this person should only use the staff screen.
        </p>
      </form>

      {loading && !staff.length ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading staff accounts…
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
          <p className="text-4xl">👥</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">No staff logins yet</h2>
          <p className="mt-1 text-sm text-gray-500">Add the first staff member above, then share the /staff link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <article
              key={member.id}
              className={`rounded-2xl border bg-white p-4 shadow-soft ${
                member.active ? 'border-surface-200' : 'border-surface-200 bg-surface-50'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-gray-900">{member.displayName}</h2>
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      @{member.username}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        member.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                    {member.phone ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        WhatsApp +91 {member.phone}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        No WhatsApp alert
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Last sign-in: {formatWhen(member.lastLoginAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(member)}
                    disabled={busy === member.id}
                    className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(member)}
                    disabled={busy === member.id}
                    className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 disabled:opacity-60"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(member)}
                    disabled={busy === member.id}
                    className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 disabled:opacity-60"
                  >
                    {member.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={busy === member.id}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
