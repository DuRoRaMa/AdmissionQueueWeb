export interface OperatorLocation {
  id: number
  name: string
  settings?: number
  disabled?: boolean
}
export interface OperatorSettings {
  id: number
  location: number
  purposes: number[]
}
export interface TalonPurpose {
  id: number
  name: string
  description: string
}
