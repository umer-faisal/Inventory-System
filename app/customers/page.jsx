"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Edit, Trash2, Search, UserCircle, Phone, Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  const [customerSales, setCustomerSales] = useState({})

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })
    if (!error) setCustomers(data || [])
  }

  const fetchCustomerSales = async (customerId) => {
    if (customerSales[customerId]) {
      setExpandedCustomer(expandedCustomer === customerId ? null : customerId)
      return
    }
    const { data } = await supabase.from("sales").select("*, sale_items(*, products(name))").eq("customer_id", customerId).order("created_at", { ascending: false })
    setCustomerSales(prev => ({ ...prev, [customerId]: data || [] }))
    setExpandedCustomer(customerId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        const { error } = await supabase.from("customers").update(formData).eq("id", editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("customers").insert(formData)
        if (error) throw error
      }
      resetForm()
      fetchCustomers()
    } catch (err) { alert("Error: " + err.message) }
  }

  const handleEdit = (c) => {
    setFormData({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "" })
    setEditingCustomer(c)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Delete this customer? Their sales records will remain.")) {
      await supabase.from("customers").delete().eq("id", id)
      fetchCustomers()
    }
  }

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", address: "" })
    setEditingCustomer(null)
    setShowModal(false)
  }

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm))

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="mt-2 text-gray-600">Manage customers and view their sales history</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Customer
          </button>
        </div>

        <div className="card">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2C5364]" />
          </div>

          <div className="space-y-3">
            {filtered.map(customer => (
              <div key={customer.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer" onClick={() => fetchCustomerSales(customer.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                        {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                        {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
                        {customer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.address}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); handleEdit(customer) }} className="text-blue-600 hover:text-blue-800 p-1"><Edit className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(customer.id) }} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                    {expandedCustomer === customer.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {expandedCustomer === customer.id && (
                  <div className="bg-gray-50 border-t p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales History</h4>
                    {(customerSales[customer.id] || []).length > 0 ? (
                      <div className="space-y-2">
                        {customerSales[customer.id].map(sale => (
                          <div key={sale.id} className="bg-white rounded-lg p-3 border text-sm flex justify-between items-center">
                            <div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${sale.status === 'Quotation' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{sale.status}</span>
                              <span className="text-gray-600">{new Date(sale.created_at).toLocaleDateString()} — {sale.warehouse}</span>
                              <div className="text-xs text-gray-400 mt-1">{sale.sale_items?.map(i => i.products?.name).join(", ")}</div>
                            </div>
                            <span className="font-bold text-gray-900">Rs {Number(sale.total_amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 text-sm">No sales records found.</p>}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No customers found.</p>}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><Phone className="w-3 h-3 inline mr-1" />Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" placeholder="03XX-XXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><Mail className="w-3 h-3 inline mr-1" />Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><MapPin className="w-3 h-3 inline mr-1" />Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2C5364]" />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingCustomer ? "Save Changes" : "Add Customer"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
