import { prisma } from './prisma'

/**
 * Mappt eine Close User ID zu einer lokalen User ID
 * @param userId - Kann eine lokale User ID oder eine Close User ID sein
 * @returns Lokale User ID oder null
 */
export async function mapUserId(userId: string | null): Promise<string | null> {
  if (!userId) return null
  
  // Wenn userId bereits eine lokale ID ist (cuid Format), gib sie zurück
  if (!userId.startsWith('user_')) {
    return userId
  }
  
  // Wenn userId eine Close User ID ist, mappe zu lokaler ID
  const localUser = await prisma.user.findFirst({
    where: { closeUserId: userId },
    select: { id: true }
  })
  
  return localUser?.id || null
}

