export type UserGymMembership = {
  id: string
  userId: string
  gymId: string
  joinedAt: string
  role: 'member' | 'owner' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
}