export interface StorageObjectItem {
  name: string
  id: string | null
}

export type StorageList = (
  path: string,
  options: { limit: number; offset: number }
) => Promise<{
  data: StorageObjectItem[] | null
  error: { message: string } | null
}>

/** Kumpulkan semua object lama di `private/**`, termasuk folder bersarang. */
export async function listPrivatePaths(
  list: StorageList,
  folder = 'private',
  limit = 100
): Promise<string[]> {
  const paths: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await list(folder, { limit, offset })
    if (error) throw new Error(error.message)

    const items = data ?? []
    for (const item of items) {
      const path = `${folder}/${item.name}`
      if (item.id === null) paths.push(...await listPrivatePaths(list, path, limit))
      else paths.push(path)
    }

    if (items.length < limit) break
    offset += limit
  }

  return paths
}
