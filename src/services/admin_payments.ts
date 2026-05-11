import pb from '@/lib/pocketbase/client'
import type { AdminPayment } from '@/types'

export const getAdminPayments = () =>
  pb.collection('admin_payments').getFullList<AdminPayment>({ sort: 'data_notificacao' })

export const createAdminPayment = (data: Partial<AdminPayment>) =>
  pb.collection('admin_payments').create<AdminPayment>(data)

export const updateAdminPayment = (id: string, data: Partial<AdminPayment>) =>
  pb.collection('admin_payments').update<AdminPayment>(id, data)

export const deleteAdminPayment = (id: string) => pb.collection('admin_payments').delete(id)

export const cloneMonthPayments = (mes: number, ano: number) =>
  pb.send('/backend/v1/admin-payments/clone', {
    method: 'POST',
    body: JSON.stringify({ mes, ano }),
    headers: { 'Content-Type': 'application/json' },
  })

export const bulkArchiveAdminPayments = (mes: number, ano: number) =>
  pb.send('/backend/v1/admin-payments/bulk-archive', {
    method: 'POST',
    body: JSON.stringify({ mes, ano }),
    headers: { 'Content-Type': 'application/json' },
  })

export const bulkDeleteAdminPayments = (mes: number, ano: number) =>
  pb.send('/backend/v1/admin-payments/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ mes, ano }),
    headers: { 'Content-Type': 'application/json' },
  })
