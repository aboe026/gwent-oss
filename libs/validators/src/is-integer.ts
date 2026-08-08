export default function isInteger(str: string) {
  return /^[0-9]+$/.test(str)
}
