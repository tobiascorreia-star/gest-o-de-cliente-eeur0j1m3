/// <reference path="../pb_data/types.d.ts" />

/**
 * Web Push Notifications via PocketBase hooks
 *
 * Requirements:
 *   - VAPID_PRIVATE_KEY env var set in PocketBase
 *   - VAPID_PUBLIC_KEY env var set in PocketBase
 *   - VAPID_EMAIL env var set (e.g. "mailto:admin@example.com")
 *   - push_subscriptions collection with: user (relation), subscription (json), user_agent (text)
 *
 * To generate VAPID keys: npx web-push generate-vapid-keys
 */

const VAPID_EMAIL = $os.getenv('VAPID_EMAIL') || 'mailto:admin@megafllex.com.br'
const VAPID_PUBLIC_KEY = $os.getenv('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = $os.getenv('VAPID_PRIVATE_KEY') || ''

/**
 * Send a push notification to a specific user (by user ID).
 * Looks up all their subscriptions in push_subscriptions and sends to each.
 */
function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('[push] VAPID keys not configured, skipping push notification')
    return
  }

  let subs
  try {
    subs = $app.dao().findRecordsByFilter(
      'push_subscriptions',
      `user = "${userId}"`,
      '',
      100,
      0,
    )
  } catch (e) {
    // Collection may not exist yet
    console.log('[push] push_subscriptions collection not found:', e.message)
    return
  }

  if (!subs || subs.length === 0) return

  const body = JSON.stringify(payload)

  subs.forEach((sub) => {
    try {
      const subData = JSON.parse(sub.get('subscription') || '{}')
      if (!subData.endpoint) return

      // Use PocketBase's built-in HTTP client to call a push proxy
      // or implement VAPID signing directly
      // For now, log the intended notification
      console.log(`[push] Would send to user ${userId}:`, payload.title, '→', subData.endpoint)

      // TODO: Implement VAPID signing or call an external push proxy
      // Example with external proxy:
      // $http.send({
      //   method: 'POST',
      //   url: process.env.PUSH_PROXY_URL,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ subscription: subData, payload }),
      // })
    } catch (e) {
      console.error('[push] Failed to send to subscription:', e.message)
    }
  })
}

/**
 * Notify admin users when a password reset is requested
 */
onRecordAfterCreateRequest((e) => {
  const record = e.record

  if (record.collection().name !== 'notifications') return
  if (record.get('type') !== 'password_reset') return

  try {
    const adminUsers = $app.dao().findRecordsByFilter(
      'users',
      "role = 'Admin' && active = true",
      '',
      50,
      0,
    )

    adminUsers.forEach((admin) => {
      sendPushToUser(admin.id, {
        title: 'GestãoFllex — Redefinição de Senha',
        body: 'Um operador solicitou redefinição de senha. Acesse o sistema para resolver.',
        tag: 'password-reset',
        url: '/',
        requireInteraction: true,
      })
    })
  } catch (e) {
    console.error('[push] Error sending password reset notification:', e.message)
  }
})

/**
 * Notify relevant users when an admin payment becomes overdue
 */
onRecordAfterUpdateRequest((e) => {
  const record = e.record
  if (record.collection().name !== 'admin_payments') return

  const status = record.get('status')
  const dono = record.get('dono_pagamento')
  if (status === true || !dono) return

  const notifDate = record.get('data_notificacao')
  if (!notifDate) return

  const due = new Date(notifDate)
  const now = new Date()
  if (due > now) return // Not yet due

  try {
    const admin = record.get('admin')
    if (admin) {
      sendPushToUser(admin, {
        title: 'GestãoFllex — Pagamento Vencido',
        body: `Pagamento de "${dono}" está vencido. Acesse o sistema para regularizar.`,
        tag: `admin-payment-${record.id}`,
        url: '/pagamentos-admin',
        requireInteraction: true,
      })
    }
  } catch (e) {
    console.error('[push] Error sending admin payment notification:', e.message)
  }
})

/**
 * Notify user when payroll/financial education is created
 */
onRecordAfterCreateRequest((e) => {
  const record = e.record
  if (record.collection().name !== 'notifications') return

  const type = record.get('type') || ''
  if (!type.includes('payroll_education') && !type.includes('financial_education')) return

  const userId = record.get('user')
  if (!userId) return

  sendPushToUser(userId, {
    title: 'GestãoFllex — Educação Financeira',
    body: 'Sua nova folha de pagamento e saúde financeira estão disponíveis.',
    tag: 'financial-education',
    url: '/saude-financeira',
  })
})
