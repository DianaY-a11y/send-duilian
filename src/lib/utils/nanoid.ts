import { nanoid } from 'nanoid'

export function generateSlug(length: number = 12): string {
  return nanoid(length)
}
