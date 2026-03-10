import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: clients } = await supabase.from('clients').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link href="/dashboard/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Nouveau client
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {clients && clients.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ville</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600">{client.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{client.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{client.city || '-'}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="text-blue-600 hover:underline text-sm">Modifier</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">Aucun client pour l\'instant</p>
            <Link href="/dashboard/clients/new" className="text-blue-600 hover:underline">Ajouter votre premier client</Link>
          </div>
        )}
      </div>
    </div>
  )
}