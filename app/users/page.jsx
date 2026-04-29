"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Trash2, Edit, UserCircle } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function Users() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "sales"
  })

  useEffect(() => {
    // Check if admin
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const u = JSON.parse(userStr)
      if (u.role !== 'admin') {
        router.push("/dashboard")
      } else {
        fetchUsers()
      }
    } else {
      router.push("/")
    }
  }, [router])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingUser) {
        const { error } = await supabase
          .from("app_users")
          .update({
            full_name: formData.full_name,
            role: formData.role,
            ...(formData.password ? { password: formData.password } : {})
          })
          .eq("id", editingUser.id)

        if (error) throw error
        alert("User updated successfully!")
      } else {
        if (!formData.password) {
          alert("Password is required for new users.")
          return
        }
        const { error } = await supabase
          .from("app_users")
          .insert({
            username: formData.username,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role
          })

        if (error) {
          if (error.code === '23505') throw new Error("Username already exists!")
          throw error
        }
        alert("User created successfully!")
      }

      resetForm()
      fetchUsers()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      role: "sales"
    })
    setEditingUser(null)
    setShowModal(false)
  }

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: "", // don't show existing password
      full_name: user.full_name || "",
      role: user.role
    })
    setEditingUser(user)
    setShowModal(true)
  }

  const handleDelete = async (id, username) => {
    if (username === 'admin') {
      alert("Cannot delete default admin account.")
      return
    }
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const { error } = await supabase.from("app_users").delete().eq("id", id)
        if (error) throw error
        fetchUsers()
      } catch (error) {
        alert("Error deleting user: " + error.message)
      }
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">Manage system users, roles, and access</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircle className="w-8 h-8 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{user.full_name || "N/A"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.username !== 'admin' && (
                        <button onClick={() => handleDelete(user.id, user.username)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364] bg-gray-50"
                    required
                    disabled={!!editingUser}
                  />
                  {editingUser && <p className="text-xs text-gray-500 mt-1">Username cannot be changed.</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? "New Password (leave blank to keep current)" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                    {...(!editingUser ? { required: true } : {})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]"
                  >
                    <option value="sales">Sales Staff (Quotes & Invoices)</option>
                    <option value="inventory">Inventory Staff (Stock Only)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingUser ? "Save Changes" : "Create User"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
