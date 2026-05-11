/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isWeekend, addDays, startOfDay } from 'date-fns'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
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
