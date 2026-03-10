import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase.from('invoices').select('*').eq('user_id', user!.id)
  const { data: clients } = await supabase.from('clients').select('*').eq('user_id', user!.id)

  const totalCA = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0
  const pending = invoices?.filter(i => i.status === 'sent').length || 0
  const overdue = invoices?.filter(i => i.status === 'overdue').length || 0
  const totalInvoices = invoices?.length || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Chiffre d\'affaires" value={`${totalCA.toFixed(2)} €`} icon="💰" color="blue" />
        <StatCard title="Total factures" value={totalInvoices.toString()} icon="📄" color="purple" />
        <StatCard title="En attente" value={pending.toString()} icon="⏳" color="yellow" />
        <StatCard title="En retard" value={overdue.toString()} icon="⚠️" color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières factures</h2>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{inv.invoice_number}</p>
                    <p className="text-sm text-gray-500">{inv.issue_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{inv.total?.toFixed(2)} €</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune facture pour l\'instant</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clients récents</h2>
          {clients && clients.length > 0 ? (
            <div className="space-y-3">
              {clients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                    {client.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucun client pour l\'instant</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600', red: 'bg-red-50 text-red-600'
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-600',
    paid: 'bg-green-100 text-green-600', overdue: 'bg-red-100 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500'
  }
  const labels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée'
  }
  return <span className={`text-xs px-2 py-1 rounded-full ${styles[status] || styles.draft}`}>{labels[status] || status}</span>
}