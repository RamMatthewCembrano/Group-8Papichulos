import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const resendApiKey = Deno.env.get("RESEND_API_KEY")
const targetEmail = Deno.env.get("TARGET_EMAIL")

serve(async (req) => {
  try {
    // Only accept POST requests for security (optional, but good practice for webhooks)
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Verify configuration
    if (!resendApiKey || !targetEmail) {
      throw new Error("Missing RESEND_API_KEY or TARGET_EMAIL in environment variables")
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Fetch logs (increase limit to handle higher volume)
    const { data: logs, error: fetchError } = await supabaseClient
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (fetchError) throw fetchError

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ message: 'No logs to send' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Format logs into CSV
    // Escape quotes and commas properly for CSV
    const escapeCsv = (str: string) => {
      if (!str) return '""'
      return '"' + str.replace(/"/g, '""') + '"'
    }

    const csvHeader = 'Date,Action,Details\n'
    const csvRows = logs.map(log => {
      const dateStr = new Date(log.created_at).toLocaleString()
      return `${escapeCsv(dateStr)},${escapeCsv(log.action)},${escapeCsv(log.details || '')}`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    // Create a simple HTML body
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Weekly Admin Logs</h2>
        <p>Your weekly admin logs report is ready.</p>
        <p>A total of <strong>${logs.length}</strong> actions were recorded this week.</p>
        <p>Please find the full logs attached as a CSV file, which you can easily open on your phone or in Excel.</p>
      </div>
    `

    // 3. Send email using Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [targetEmail],
        subject: 'Papicholos: Weekly Admin Logs Report',
        html: htmlContent,
        attachments: [
          {
            filename: `admin_logs_${new Date().toISOString().split('T')[0]}.csv`,
            content: btoa(unescape(encodeURIComponent(csvContent)))
          }
        ]
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend API error: ${err}`)
    }

    // 4. Delete the fetched logs from the database
    const logIds = logs.map(l => l.id)
    const { error: deleteError } = await supabaseClient
      .from('admin_logs')
      .delete()
      .in('id', logIds)

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: 'Logs emailed and cleared successfully', count: logs.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
