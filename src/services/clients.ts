import pb from '@/lib/pocketbase/client'
import { Client } from '@/types'

export const getClients = () =>
  pb.collection('clients').getFullList<Client>({
    expand: 'colaborador,solicitacao,status,categoria,pgto',
    sort: '-created',
  })

export const getClient = (id: string) =>
  pb.collection('clients').getOne<Client>(id, {
    expand: 'colaborador,solicitacao,status,categoria,pgto',
  })

export const createClient = (data: Partial<Client>) => pb.collection('clients').create<Client>(data)

export const updateClient = (id: string, data: Partial<Client>) =>
  pb.collection('clients').update<Client>(id, data)

export const deleteClient = (id: string) => pb.collection('clients').delete(id)
