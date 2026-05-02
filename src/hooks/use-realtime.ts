export function useRealtime(
  collectionName: string,
  callback: (data: any) => void,
  enabled: boolean = true,
) {
  // Hook disabled for frontend-only mode.
  // No-op to avoid breaking existing imports while decoupled from backend.
}

export default useRealtime
