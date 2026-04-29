"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { Plus, Calendar, User, Package, Building2, Printer, FileText } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function Sales() {
  const [inventoryItems, setInventoryItems] = useState([])
  const [sales, setSales] = useState([])
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    warehouse: "Nazimabad",
    has_tax: false,
    status: "Invoice", // Invoice or Quotation
    items: [],
  })

  const warehouses = ["Nazimabad", "SITE"]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: invData, error: invError } = await supabase.from("inventory").select(`*, products(*)`)
      if (invError) throw invError
      setInventoryItems(invData || [])

      const { data: salesData, error: salesError } = await supabase
        .from("sales").select(`*, customers(name)`).order("created_at", { ascending: false })
      if (salesError) throw salesError
      
      if (salesData && salesData.length > 0) {
        const saleIds = salesData.map(s => s.id)
        const { data: itemsData } = await supabase.from("sale_items").select(`*, products(name)`).in("sale_id", saleIds)
        
        const salesWithItems = salesData.map(sale => ({
          ...sale, items: itemsData?.filter(i => i.sale_id === sale.id) || []
        }))
        setSales(salesWithItems)
      } else {
        setSales([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { inventory_id: "", product_id: "", quantity: 1, price: 0 }] })
  }

  const updateItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        if (field === "inventory_id" && value) {
          const invItem = inventoryItems.find((p) => p.id === value)
          if (invItem && invItem.products) {
            updatedItem.product_id = invItem.products.id
            updatedItem.price = invItem.products.selling_price
          }
        }
        return updatedItem
      }
      return item
    })
    setFormData({ ...formData, items: updatedItems })
  }

  const removeItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const calculateTotal = () => formData.has_tax ? calculateSubtotal() * 1.18 : calculateSubtotal()

  const getAvailableStock = (inventoryId) => {
    const item = inventoryItems.find((p) => p.id === inventoryId)
    return item ? item.quantity : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.items.length === 0) return alert("Please add at least one item")
    if (!formData.customerName.trim()) return alert("Customer name is required")

    try {
      if (formData.status === "Invoice") {
        for (const item of formData.items) {
          const invItem = inventoryItems.find((p) => p.id === item.inventory_id)
          if (!invItem || item.quantity > invItem.quantity) {
            return alert(`Insufficient stock for ${invItem?.products?.name || 'Item'}. Available: ${invItem?.quantity || 0}`)
          }
        }
      }

      let customerId = null
      const { data: existingCustomers } = await supabase.from("customers").select("id").ilike("name", formData.customerName).limit(1)

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id
      } else {
        const { data: newCustomer, error: custError } = await supabase.from("customers").insert({ name: formData.customerName }).select().single()
        if (custError) throw custError
        customerId = newCustomer.id
      }

      const subtotal = calculateSubtotal()
      const taxAmount = formData.has_tax ? subtotal * 0.18 : 0
      
      const { data: saleData, error: saleError } = await supabase.from("sales").insert({
        customer_id: customerId, warehouse: formData.warehouse, total_amount: subtotal + taxAmount, has_tax: formData.has_tax, tax_amount: taxAmount, status: formData.status
      }).select().single()

      if (saleError) throw saleError

      for (const item of formData.items) {
        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: saleData.id, product_id: item.product_id, quantity: item.quantity, unit_price: item.price, total_price: item.quantity * item.price
        })
        if (itemError) throw itemError

        if (formData.status === "Invoice") {
          const invItem = inventoryItems.find(p => p.id === item.inventory_id)
          const { error: updateError } = await supabase.from("inventory").update({ quantity: invItem.quantity - item.quantity }).eq("id", item.inventory_id)
          if (updateError) throw updateError
        }
      }

      alert(`${formData.status} recorded successfully!`)
      resetForm()
      fetchData()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split("T")[0], customerName: "", warehouse: "Nazimabad", has_tax: false, status: "Invoice", items: [] })
    setShowModal(false)
  }

  const handlePrint = (sale) => {
    // In a real app, you'd open a new window or route to a print-friendly page
    // For now, we simulate print by calling window.print()
    alert(`Printing ${sale.status} #${sale.id.slice(0,6)}... \nIn browser you would press Ctrl+P for the print layout.`)
    window.print()
  }

  const availableInventoryItems = inventoryItems.filter(item => item.warehouse === formData.warehouse && item.quantity > 0)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales & Quotations</h1>
            <p className="mt-2 text-gray-600">Record sales, generate quotations, and print invoices</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Record
          </button>
        </div>

        <div className="card print:hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
          {sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sale.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{sale.customers?.name || "Unknown"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${sale.has_tax ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {sale.has_tax ? 'Tax' : 'Non-Tax'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${sale.status === 'Quotation' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Rs {Number(sale.total_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button onClick={() => handlePrint(sale)} className="text-blue-600 hover:text-blue-900 flex items-center">
                           <Printer className="w-4 h-4 mr-1" /> Print
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-center py-8">No records yet</p>}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">New Transaction</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><User className="w-4 h-4 inline mr-1" /> Customer</label>
                    <input type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><Building2 className="w-4 h-4 inline mr-1" /> Warehouse</label>
                    <select value={formData.warehouse} onChange={(e) => setFormData({ ...formData, warehouse: e.target.value, items: [] })} className="w-full px-3 py-2 border rounded-lg bg-white">
                      {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                    <select value={formData.has_tax} onChange={(e) => setFormData({...formData, has_tax: e.target.value === 'true'})} className="w-full px-3 py-2 border rounded-lg">
                      <option value={false}>Non-Tax Invoice</option>
                      <option value={true}>Tax Invoice (18% GST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-blue-50 font-bold">
                      <option value="Invoice">Final Invoice (Deducts Stock)</option>
                      <option value="Quotation">Quotation (Does NOT Deduct Stock)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700"><Package className="w-4 h-4 inline mr-1" /> Products</label>
                    <button type="button" onClick={addItem} className="btn-secondary text-sm">+ Add Item</button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 p-3 border rounded-lg">
                      <div className="md:col-span-5">
                        <select value={item.inventory_id} onChange={(e) => updateItem(index, "inventory_id", e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                          <option value="">Select...</option>
                          {availableInventoryItems.map((inv) => <option key={inv.id} value={inv.id}>{inv.products?.name} - In Stock: {inv.quantity}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2"><input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value)||0)} className="w-full px-3 py-2 border rounded-lg text-sm" min="1" max={formData.status === 'Invoice' ? getAvailableStock(item.inventory_id) : undefined} required /></div>
                      <div className="md:col-span-2"><input type="number" value={item.price} onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value)||0)} className="w-full px-3 py-2 border rounded-lg text-sm" min="0" required /></div>
                      <div className="md:col-span-3 flex justify-between items-center"><span className="font-bold">Rs {(item.quantity * item.price).toLocaleString()}</span><button type="button" onClick={() => removeItem(index)} className="text-red-500">X</button></div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 text-right">
                  <div className="text-xl font-bold">Total: Rs {calculateTotal().toLocaleString()}</div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save {formData.status}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
