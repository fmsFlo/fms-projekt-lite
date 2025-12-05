"use client"
import { useState, useEffect } from 'react'

type User = {
  id: string
  email: string
  role: 'admin' | 'advisor'
  name: string | null
  isActive: boolean
  visibleCategories: string | null
  createdAt: string
  updatedAt: string
}

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'advisor' as 'admin' | 'advisor',
    name: '',
    visibleCategories: [] as string[]
  })
  const [passwordForm, setPasswordForm] = useState({
    userId: '',
    newPassword: ''
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const templates = await res.json()
        const categories = Array.from(new Set(templates.map((t: any) => t.category).filter(Boolean)))
        setAvailableCategories(categories.sort())
      }
    } catch (err) {
      console.error('Fehler beim Laden der Kategorien:', err)
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        console.log('📋 Geladene Benutzer:', data)
        setUsers(data)
      } else if (res.status === 403) {
        setError('Sie haben keine Berechtigung, Benutzer zu verwalten')
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.message || 'Fehler beim Laden der Benutzer')
      }
    } catch (err: any) {
      console.error('❌ Load Users Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(user: User) {
    setEditingUser(user)
    let visibleCategories: string[] = []
    if (user.visibleCategories) {
      try {
        visibleCategories = JSON.parse(user.visibleCategories)
      } catch {
        visibleCategories = []
      }
    }
    setForm({
      email: user.email,
      password: '',
      role: user.role,
      name: user.name || '',
      visibleCategories
    })
    setShowForm(true)
    setError(null)
  }

  function startCreate() {
    setEditingUser(null)
    setForm({
      email: '',
      password: '',
      role: 'advisor',
      name: '',
      visibleCategories: []
    })
    setShowForm(true)
    setError(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingUser(null)
    setForm({
      email: '',
      password: '',
      role: 'advisor',
      name: '',
      visibleCategories: []
    })
    setError(null)
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editingUser) {
        // Update
        const updateData: any = {
          id: editingUser.id,
          email: form.email,
          role: form.role,
          name: form.name || null,
          visibleCategories: form.role === 'admin' ? undefined : form.visibleCategories
        }
        if (form.password) {
          updateData.password = form.password
        }

        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Fehler beim Aktualisieren')
        }
      } else {
        // Create
        if (!form.password) {
          throw new Error('Passwort ist erforderlich')
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: form.role,
            name: form.name || null,
            visibleCategories: form.role === 'admin' ? undefined : form.visibleCategories
          })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Fehler beim Erstellen')
        }
      }

      await loadUsers()
      cancelForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Aktualisieren')
      }

      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Möchten Sie den Benutzer "${user.email}" wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Löschen')
      }

      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function startChangePassword(user: User) {
    setPasswordForm({
      userId: user.id,
      newPassword: ''
    })
    setShowPasswordForm(true)
    setError(null)
  }

  function cancelPasswordForm() {
    setShowPasswordForm(false)
    setPasswordForm({
      userId: '',
      newPassword: ''
    })
    setError(null)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    setError(null)

    try {
      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
        throw new Error('Passwort muss mindestens 6 Zeichen lang sein')
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: passwordForm.userId,
          password: passwordForm.newPassword
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Ändern des Passworts')
      }

      await loadUsers()
      cancelPasswordForm()
      alert('✅ Passwort erfolgreich geändert!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="p-4">Lade Benutzer…</div>
  }

  return (
    <section className="border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Benutzerverwaltung</h2>
        {!showForm && (
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Neuer Benutzer
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showPasswordForm ? (
        <div className="mb-4 p-4 border border-gray-300 rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Passwort ändern</h3>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Neues Passwort *</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {changingPassword ? 'Speichere…' : 'Passwort speichern'}
              </button>
              <button
                type="button"
                onClick={cancelPasswordForm}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={saveUser} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">E-Mail-Adresse *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-sm mb-1">Passwort *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Rolle *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'advisor' })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="advisor">Berater</option>
              <option value="admin">Administrator</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Administratoren sehen alle Kategorien. Berater sehen nur die ausgewählten Kategorien.
            </p>
          </div>
          {form.role === 'advisor' && (
            <div>
              <label className="block text-sm mb-2">Sichtbare Kategorien *</label>
              <p className="text-xs text-gray-500 mb-2">
                Wählen Sie die Kategorien aus, die dieser Berater sehen darf. Wenn keine ausgewählt wird, sieht der Berater keine Honorarverträge.
              </p>
              <div className="space-y-2 border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                {availableCategories.length === 0 ? (
                  <p className="text-sm text-gray-500">Lade Kategorien...</p>
                ) : (
                  availableCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.visibleCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({
                              ...form,
                              visibleCategories: [...form.visibleCategories, category]
                            })
                          } else {
                            setForm({
                              ...form,
                              visibleCategories: form.visibleCategories.filter(c => c !== category)
                            })
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Name (optional)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Speichere…' : editingUser ? 'Aktualisieren' : 'Erstellen'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-2 text-left text-sm font-semibold">E-Mail</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Rolle</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Keine Benutzer vorhanden
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.name || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Berater'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => startChangePassword(user)}
                          className="px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Passwort
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          className={`px-2 py-1 text-sm rounded ${
                            user.isActive
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

