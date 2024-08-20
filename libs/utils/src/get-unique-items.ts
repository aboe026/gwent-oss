// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getUniqueItems<T>(items: any[]): T[] {
  return [...new Set(items)]
}
