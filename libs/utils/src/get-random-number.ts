export default function getRandomNumber({ min, max }: { min: number; max: number }): number {
  if (min > max) {
    throw new Error('Min must be less than or equal to Max')
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}
