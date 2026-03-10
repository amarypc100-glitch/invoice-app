'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Item { description: string; quantity: number; unit_price: number; total: number }

export default function NewInvoicePage() {
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({ client_id: '', invoice_number: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', status: 'draft', tax_rate: 20, notes: '', payment_terms: '' })
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('clients').select('*').eq('user_id', user.id).then(({ data }) => setClients(data || []))
        setForm(f => ({ ...f, invoice_number: 'FAC-' + Date.now().toString().slice(-6) }))
      }
    })
  }, [])

  const updateItem = (idx: number, field: keyof Item, value: string | number) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    newItems[idx].total = newItems[idx].quantity * newItems[idx].unit_price
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const taxAmount = subtotal * (form.tax_rate / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: invoice, error: invErr } = await supabase.from('invoices').insert({
      ...form, user_id: user!.id, subtotal, tax_amount: taxAmount, total
    }).select().single()
    if (invErr) { setError(invErr.message); setLoading(false); return; }
    await supabase.from('invoice_items').insert(items.map(item => ({ ...item, invoice_id: invoice.id })))
    router.push('/dashboard/invoices')
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nouvelle facture</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de facture *</label>
              <input required value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d\'émission</label>
              <input type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d\'échéance</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
              <input type="number" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Articles</h2>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="Qté" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-3">
                  <input type="number" placeholder="Prix unitaire" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 text-right font-medium text-gray-700">{item.total.toFixed(2)} €</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])} className="mt-4 text-blue-600 hover:underline text-sm">
            + Ajouter une ligne
          </button>
          <div className="mt-6 border-t border-gray-200 pt-4 text-right space-y-1">
            <p className="text-gray-600">Sous-total : <span className="font-medium">{subtotal.toFixed(2)} €</span></p>
            <p className="text-gray-600">TVA ({form.tax_rate}%) : <span className="font-medium">{taxAmount.toFixed(2)} €</span></p>
            <p className="text-lg font-bold text-gray-900">Total : {total.toFixed(2)} €</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Notes ou mentions légales..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Enregistrement...' : 'Créer la facture'}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}