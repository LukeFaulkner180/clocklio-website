export type TesterEmailOptions = { url: string; serviceKey: string; apiKey?: string; signupId?: string; fetcher?: typeof fetch }
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
export function testerEmailPayload(job: { kind: string; recipient_email: string }, signup: Record<string, any>) {
  const name = escapeHtml(signup.contact_name), business = escapeHtml(signup.business_name)
  const owner = job.kind === 'owner_alert'
  const subject = owner ? 'New DayRidge tester application' : 'Your DayRidge tester registration'
  const text = owner
    ? `A new business registered for DayRidge testing.\nBusiness: ${signup.business_name}\nContact: ${signup.contact_name}\nEmail: ${signup.email}\nTeam size: ${signup.team_size}\nReview it in your dashboard: https://app.dayridge.co.uk/ → Tester applications.`
    : `Hi ${signup.contact_name},\nThanks for registering ${signup.business_name} to test DayRidge. We have saved your application and will contact you about early access and the agreed testing activities.\nComplete the agreed testing and feedback to qualify for 10% off an annual subscription if you choose to continue. Registration alone does not qualify. No paid subscription has started.\nDayRidge — coming in 2027\nhttps://dayridge.co.uk/`
  const content = owner
    ? `<h1 style="font-size:25px">A new business wants to test DayRidge</h1><p><b>${business}</b> has registered.</p><p>Contact: ${name}<br>Email: ${escapeHtml(signup.email)}<br>Business type: ${escapeHtml(signup.industry)}<br>Team size: ${escapeHtml(signup.team_size)}<br>Interested in: ${escapeHtml((signup.interests ?? []).join(', '))}</p><p>${escapeHtml(signup.goals)}</p><p><a href="https://app.dayridge.co.uk/" style="color:#6c4fda">Open your dashboard</a> and choose Tester applications.</p>`
    : `<h1 style="font-size:25px">Thanks for registering, ${name}</h1><p>We’ve received the application for <b>${business}</b>.</p><p>We’ll be in touch about early access and agree the testing activities and feedback with you before you start.</p><div style="background:#f1edff;padding:18px;border-radius:12px"><b>Early access + 10% off</b><p>Complete the agreed testing and feedback to qualify for 10% off an annual subscription if you choose to continue with DayRidge. Registration alone does not qualify.</p></div><p>No paid subscription has started.</p><p>Coming in 2027 · <a href="https://dayridge.co.uk/" style="color:#6c4fda">dayridge.co.uk</a></p>`
  return { from: 'DayRidge <no-reply@dayridge.co.uk>', to: [job.recipient_email], subject, text, html: `<!doctype html><html><body style="margin:0;background:#f5f4f9;font-family:Arial,sans-serif;color:#293145"><div style="max-width:560px;margin:30px auto;padding:32px;background:white;border-radius:20px"><div style="font-size:27px;font-weight:bold;margin-bottom:26px">Day<span style="color:#6c4fda">Ridge</span></div>${content}</div></body></html>` }
}
export async function dispatchTesterEmails(options: TesterEmailOptions) {
  if (!options.apiKey) return { configured: false, sent: 0, failed: 0 }
  const send = options.fetcher ?? fetch
  const headers = { apikey: options.serviceKey, Authorization: `Bearer ${options.serviceKey}`, 'Content-Type': 'application/json' }
  const claim = await send(`${options.url}/rest/v1/rpc/claim_dayridge_tester_emails`, { method: 'POST', headers, body: JSON.stringify({ p_signup_id: options.signupId ?? null, p_limit: options.signupId ? 2 : 10 }), signal: AbortSignal.timeout(10000) })
  if (!claim.ok) throw new Error('The email queue could not be checked.')
  const jobs = await claim.json()
  let sent = 0, failed = 0
  for (const job of jobs) {
    let providerId: string | null = null, error = ''
    try {
      const result = await send(`${options.url}/rest/v1/dayridge_tester_signups?id=eq.${encodeURIComponent(job.signup_id)}&select=contact_name,business_name,email,industry,team_size,interests,goals`, { headers, signal: AbortSignal.timeout(10000) })
      if (!result.ok) throw new Error('Application lookup failed')
      const signup = (await result.json())[0]
      if (!signup) throw new Error('Application unavailable')
      const response = await send('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dayridge-tester/${job.id}` }, body: JSON.stringify(testerEmailPayload(job, signup)), signal: AbortSignal.timeout(10000) })
      if (!response.ok) { error = `Email provider returned HTTP ${response.status}. Check the sender domain, key and sending limit.` }
      else { providerId = (await response.json()).id ?? null; if (!providerId) error = 'Email provider did not confirm acceptance.' }
    } catch { error = 'Email delivery could not be confirmed. Retry from the owner dashboard.' }
    const update = await send(`${options.url}/rest/v1/dayridge_tester_emails?id=eq.${encodeURIComponent(job.id)}`, { method: 'PATCH', headers, body: JSON.stringify({ status: error ? 'failed' : 'sent', sent_at: error ? null : new Date().toISOString(), last_error: error, provider_id: providerId }), signal: AbortSignal.timeout(10000) })
    if (!update.ok) throw new Error('Email status could not be saved. The queue keeps its delivery key for a safe retry.')
    if (error) failed++; else sent++
  }
  return { configured: true, sent, failed }
}
