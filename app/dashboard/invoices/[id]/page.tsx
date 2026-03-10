'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: inv }, { data: itms }, { data: prof }] = await Promise.all([
        supabase.from('invoices').select('*, clients(*)').eq('id', params.id).single(),
        supabase.from('invoice_items').select('*').eq('invoice_id', params.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ])
      setInvoice(inv)
      setItems(itms || [])
      setProfile(prof)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235)
    doc.text(profile?.company_name || 'Mon Entreprise', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    if (profile?.company_address) doc.text(profile.company_address, 14, 28)
    if (profile?.company_phone) doc.text(profile.company_phone, 14, 34)
    if (profile?.company_email) doc.text(profile.company_email, 14, 40)
    if (profile?.company_siret) doc.text('SIRET: ' + profile.company_siret, 14, 46)

    // Invoice title
    doc.setFontSize(24)
    doc.setTextColor(0, 0, 0)
    doc.text('FACTURE', 140, 20)
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text('N° ' + invoice.invoice_number, 140, 30)
    doc.text('Date: ' + invoice.issue_date, 140, 37)
    if (invoice.due_date) doc.text('Échéance: ' + invoice.due_date, 140, 44)

    // Client
    if (invoice.clients) {
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text('Facturé à:', 14, 60)
      doc.setFontSize(10)
      doc.setTextColor(50, 50, 50)
      doc.text(invoice.clients.name, 14, 68)
      if (invoice.clients.address) doc.text(invoice.clients.address, 14, 74)
      if (invoice.clients.email) doc.text(invoice.clients.email, 14, 80)
    }

    // Items table
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total']],
      body: items.map(item => [item.description, item.quantity, item.unit_price.toFixed(2) + ' €', item.total.toFixed(2) + ' €']),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text('Sous-total: ' + invoice.subtotal?.toFixed(2) + ' €', 140, finalY)
    doc.text('TVA (' + invoice.tax_rate + '%): ' + invoice.tax_amount?.toFixed(2) + ' €', 140, finalY + 7)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL: ' + invoice.total?.toFixed(2) + ' €', 140, finalY + 17)

    if (invoice.notes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Notes: ' + invoice.notes, 14, finalY + 30)
    }

    doc.save('facture-' + invoice.invoice_number + '.pdf')
  }

  const statusLabels: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (!invoice) return <div className="text-center text-gray-500">Facture introuvable</div>

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facture {invoice.invoice_number}</h1>
          <span className="text-sm text-gray-500">{invoice.issue_date}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            📄 Exporter PDF
          </button>
          <button onClick={() => router.back()} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            Retour
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-blue-600">{profile?.company_name || 'Mon Entreprise'}</h2>
            {profile?.company_address && <p className="text-gray-600 text-sm mt-1">{profile.company_address}</p>}
            {profile?.company_email && <p className="text-gray-600 text-sm">{profile.company_email}</p>}
            {profile?.company_siret && <p className="text-gray-600 text-sm">SIRET: {profile.company_siret}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-400">FACTURE</h2>
            <p className="text-gray-700 font-medium">N° {invoice.invoice_number}</p>
            <p className="text-gray-500 text-sm">Date: {invoice.issue_date}</p>
            {invoice.due_date && <p className="text-gray-500 text-sm">Échéance: {invoice.due_date}</p>}
          </div>
        </div>

        {invoice.clients && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Facturé à</p>
            <p className="font-semibold text-gray-900">{invoice.clients.name}</p>
            {invoice.clients.address && <p className="text-gray-600 text-sm">{invoice.clients.address}</p>}
            {invoice.clients.email && <p className="text-gray-600 text-sm">{invoice.clients.email}</p>}
          </div>
        )}

        <table className="w-full mb-6">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left px-4 py-3 rounded-tl-lg">Description</th>
              <th className="text-center px-4 py-3">Qté</th>
              <th className="text-right px-4 py-3">Prix unit.</th>
              <th className="text-right px-4 py-3 rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3 text-gray-700">{item.description}</td>
                <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.unit_price?.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right font-medium">{item.total?.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{invoice.subtotal?.toFixed(2)} €</span></div>
            <div className="flex justify-between text-gray-600"><span>TVA ({invoice.tax_rate}%)</span><span>{invoice.tax_amount?.toFixed(2)} €</span></div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2"><span>Total</span><span>{invoice.total?.toFixed(2)} €</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 font-medium mb-1">Notes</p>
            <p className="text-gray-600 text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}