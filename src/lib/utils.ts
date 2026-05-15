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
  if (!client || !alertSettings || !client.updated) {
    return {
      isCritical: false,
      isModerate: false,
      isOldAdmin: false,
      daysSinceUpdated: 0,
      isMonthTurnover: false,
    }
  }

  const updatedDate = new Date(client.updated)
  const now = new Date()
  const daysSinceUpdated = differenceInCalendarDays(now, updatedDate)
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

  if (
    (isAguardando || isAtencao) &&
    (daysSinceUpdated > alertSettings.critical_days || isMonthTurnover)
  ) {
    isCritical = true
  } else if (isAguardando && daysSinceUpdated > alertSettings.old_days) {
    isModerate = true
  }

  if (isAdmin && isAberto && daysSinceUpdated > alertSettings.old_days) {
    isOldAdmin = true
  }

  return { isCritical, isModerate, isOldAdmin, daysSinceUpdated, isMonthTurnover }
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
