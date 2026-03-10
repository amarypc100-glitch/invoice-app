import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const statusLabels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée'
  }
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-600',
    paid: 'bg-green-100 text-green-600', overdue: 'bg-red-100 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <Link href="/dashboard/invoices/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Nouvelle facture
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {invoices && invoices.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.clients?.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.issue_date}</td>
                  <td className="px-6 py-4 font-medium">{inv.total?.toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[inv.status] || statusColors.draft}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-600 hover:underline text-sm">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">Aucune facture pour l\'instant</p>
            <Link href="/dashboard/invoices/new" className="text-blue-600 hover:underline">Créer votre première facture</Link>
          </div>
        )}
      </div>
    </div>
  )
}