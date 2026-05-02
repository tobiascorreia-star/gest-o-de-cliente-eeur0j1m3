import pb from '@/lib/pocketbase/client'

export const getConfigurations = () =>
  pb.collection('configurations').getFullList({ sort: '-created' })
export const getConfiguration = (id: string) => pb.collection('configurations').getOne(id)
export const createConfiguration = (data: any) => pb.collection('configurations').create(data)
export const updateConfiguration = (id: string, data: any) =>
  pb.collection('configurations').update(id, data)
export const deleteConfiguration = (id: string) => pb.collection('configurations').delete(id)
