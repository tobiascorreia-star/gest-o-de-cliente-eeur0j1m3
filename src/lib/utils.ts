/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isWeekend, addDays, startOfDay, differenceInCalendarDays } from 'date-fns'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function getClientAlertState(client: any, alertSettings: any, isAdmin: boolean) {
  if (!client) {
    return {
      isCritical: false,
      isModerate: false,
      isOldAdmin: false,
      isMonthCritical: false,
      daysSinceUpdated: 0,
      isMonthTurnover: false,
    }
  }

  const targetDateStr = client.updated || client.created || new Date().toISOString()
  const updatedDate = new Date(targetDateStr)
  const now = new Date()

  const updatedDateMidnight = new Date(
    updatedDate.getFullYear(),
    updatedDate.getMonth(),
    updatedDate.getDate(),
  )
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const daysSinceUpdated = differenceInCalendarDays(nowMidnight, updatedDateMidnight)
  const isMonthTurnover =
    now.getMonth() !== updatedDate.getMonth() || now.getFullYear() !== updatedDate.getFullYear()

  const statusName = (client.expand?.status?.name || '').toUpperCase()
  const pgtoName = (client.expand?.pgto?.name || '').toUpperCase()

  const isConcluido =
    statusName === 'CONCLUÍDO' || statusName === 'CONCLUIDO' || statusName === 'BAIXA'
  if (isConcluido) {
    return {
      isCritical: false,
      isModerate: false,
      isOldAdmin: false,
      isMonthCritical: false,
      daysSinceUpdated,
      isMonthTurnover,
    }
  }

  const isAguardando = statusName === 'AGUARDANDO'
  const isAtencao = statusName === 'ATENÇÃO' || statusName === 'ATENCAO'
  const isAberto = pgtoName === 'ABERTO'

  let isCritical = false
  let isModerate = false
  let isOldAdmin = false
  let isMonthCritical = false

  const criticalDays = alertSettings?.critical_days ?? 30
  const oldDays = alertSettings?.old_days ?? 15
  const oldAdminDays = alertSettings?.old_admin_days ?? 15

  if ((isAguardando || isAtencao) && daysSinceUpdated > criticalDays) {
    isCritical = true
  }

  if (isAguardando && daysSinceUpdated > oldDays) {
    isModerate = true
  }

  if (isAdmin && isAberto && daysSinceUpdated > oldAdminDays) {
    isOldAdmin = true
  }

  if ((isAguardando || isAtencao) && isMonthTurnover) {
    isMonthCritical = true
  }

  return { isCritical, isModerate, isOldAdmin, isMonthCritical, daysSinceUpdated, isMonthTurnover }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEffectiveDueDate(date: Date | string | number): Date {
  let target = startOfDay(new Date(date))
  while (isWeekend(target)) {
    target = addDays(target, 1)
  }
  return target
}

export function isOverdueBusiness(dueDate: Date | string | number | null | undefined): boolean {
  if (!dueDate) return false
  const effectiveDue = getEffectiveDueDate(dueDate)
  const today = startOfDay(new Date())
  return effectiveDue.getTime() < today.getTime()
}

export function isTodayBusiness(dueDate: Date | string | number | null | undefined): boolean {
  if (!dueDate) return false
  const effectiveDue = getEffectiveDueDate(dueDate)
  const today = startOfDay(new Date())
  return effectiveDue.getTime() === today.getTime()
}

export function isTomorrowBusiness(dueDate: Date | string | number | null | undefined): boolean {
  if (!dueDate) return false
  const effectiveDue = getEffectiveDueDate(dueDate)
  const today = startOfDay(new Date())
  let nextBusinessDay = addDays(today, 1)
  while (isWeekend(nextBusinessDay)) {
    nextBusinessDay = addDays(nextBusinessDay, 1)
  }
  return effectiveDue.getTime() === nextBusinessDay.getTime()
}

// Add any other utility functions here
