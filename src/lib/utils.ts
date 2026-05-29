import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTodayBusiness(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isOverdueBusiness(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

export function isTomorrowBusiness(dateStr: string) {
  const date = new Date(dateStr)
  const nextBusinessDay = new Date()

  if (nextBusinessDay.getDay() === 5) {
    // Friday
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 3)
  } else if (nextBusinessDay.getDay() === 6) {
    // Saturday
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 2)
  } else {
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1)
  }

  return (
    date.getDate() === nextBusinessDay.getDate() &&
    date.getMonth() === nextBusinessDay.getMonth() &&
    date.getFullYear() === nextBusinessDay.getFullYear()
  )
}

export function getEffectiveDueDate(dateStr?: string | null) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = date.getDay()
  if (day === 6) {
    // Saturday
    date.setDate(date.getDate() + 2)
  } else if (day === 0) {
    // Sunday
    date.setDate(date.getDate() + 1)
  }
  return date.toISOString()
}

export function getClientAlertState(client: any, alertSettings: any, isAdmin: boolean) {
  const statusName = client.expand?.status?.name?.toUpperCase() || ''
  const pgtoName = client.expand?.pgto?.name?.toUpperCase() || ''

  const isAguardando = statusName === 'AGUARDANDO'
  const isAtencao = statusName === 'ATENÇÃO' || statusName === 'ATENCAO'
  const isAberto = pgtoName === 'ABERTO'

  const updatedStr = client.updated || client.created
  let daysSinceUpdated = 0

  if (updatedStr) {
    const updatedDate = new Date(updatedStr)
    const now = new Date()
    daysSinceUpdated = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  const oldDays = alertSettings?.old_days || 0
  const criticalDays = alertSettings?.critical_days || 0
  const oldAdminDays = alertSettings?.old_admin_days || 0

  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysToMonthEnd = Math.round(
    (endOfMonthDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Rule 04: End of month, last 4 days (daysToMonthEnd <= 3 means 0, 1, 2, or 3 days remaining)
  const isMonthCritical = isAberto && daysToMonthEnd <= 3

  // Rule 02: Critical
  const isCritical =
    (isAguardando || isAtencao) && criticalDays > 0 && daysSinceUpdated > criticalDays

  // Rule 01: Moderate
  const isModerate = isAguardando && oldDays > 0 && daysSinceUpdated > oldDays

  // Rule 03: Old Admin
  const isOldAdmin = isAdmin && isAberto && oldAdminDays > 0 && daysSinceUpdated > oldAdminDays

  return {
    isCritical,
    isModerate,
    isOldAdmin,
    isMonthCritical,
    daysSinceUpdated,
    daysToMonthEnd,
  }
}
