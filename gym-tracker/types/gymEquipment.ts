export type GymEquipment = {
  id: string
  gymId: string
  equipmentId: string
  nickname?: string
  brand?: string
  model?: string
  quantity?: number
  isAvailable: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}