import pb from '@/lib/pocketbase/client'

export const getUsers = () => pb.collection('users').getFullList({ sort: '-created' })

export const getUser = (id: string) => pb.collection('users').getOne(id)

export const createUser = (data: FormData | any) => pb.collection('users').create(data)

export const updateUser = (id: string, data: FormData | any) =>
  pb.collection('users').update(id, data)

export const deleteUser = (id: string) => pb.collection('users').delete(id)

export const getFileUrl = (record: any, filename: string) => pb.files.getURL(record, filename)
