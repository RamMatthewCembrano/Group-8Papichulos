import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const resendApiKey = Deno.env.get("RESEND_API_KEY")
const targetEmail = Deno.env.get("TARGET_EMAIL")

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    if (!resendApiKey || !targetEmail) {
      throw new Error("Missing RESEND_API_KEY or TARGET_EMAIL")
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Fetch recent orders
    const { data: orders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (fetchError) throw fetchError

    // Bulletproof filtering: Format both "now" and the order's "created_at" in Manila time (YYYY-MM-DD)
    const manilaFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

    // If the cron runs at exactly 12:00 AM, `new Date()` is already the NEXT day.
    // Subtracting 4 hours ensures we safely evaluate the date as the "day that just finished".
    const targetDate = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const todayStr = manilaFormatter.format(targetDate)

    // Only include orders that happened TODAY in Manila time
    const todayOrders = (orders || []).filter(o => manilaFormatter.format(new Date(o.created_at)) === todayStr)

    // Calculate Stats
    let totalRevenue = 0
    let completedCount = 0
    let cancelledCount = 0
    let activeCount = 0
    let pickupCount = 0
    let dineInCount = 0

    const itemCounts: Record<string, number> = {}
    const itemRevenue: Record<string, number> = {}

    for (const o of todayOrders) {
      const isPickup = o.table_number === "STORE-PICKUP" || (o.table_number && o.table_number.startsWith("PUP-"))
      
      if (isPickup) pickupCount++
      else dineInCount++

      if (o.status === 'completed') {
        completedCount++
        totalRevenue += (o.total_price || 0)

        // Tally items only for completed orders (or you can tally for all non-cancelled)
        if (o.order_items && Array.isArray(o.order_items)) {
          for (const item of o.order_items) {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1)
            itemRevenue[item.name] = (itemRevenue[item.name] || 0) + ((item.price || 0) * (item.quantity || 1))
          }
        }
      } else if (o.status === 'cancelled') {
        cancelledCount++
      } else {
        activeCount++
      }
    }

    // Sort items by quantity sold
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // top 5 items

    const htmlRows = topItems.length > 0 
      ? topItems.map(([name, qty]) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${itemRevenue[name]?.toLocaleString() || 0}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="padding: 8px; text-align: center; color: #888;">No items sold today.</td></tr>'

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <h2 style="color: #111; margin-bottom: 24px;">Daily End-of-Day Report</h2>
        
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #eee;">
            <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Total Revenue</div>
            <div style="font-size: 24px; color: #111; font-weight: 300;">₱${totalRevenue.toLocaleString()}</div>
          </div>
          <div style="flex: 1; background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #eee;">
            <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Total Orders</div>
            <div style="font-size: 24px; color: #111; font-weight: 300;">${todayOrders.length}</div>
          </div>
        </div>

        <h3 style="color: #333; margin-bottom: 16px; border-bottom: 2px solid #111; padding-bottom: 8px;">Quick Stats</h3>
        <ul style="list-style: none; padding: 0; margin-bottom: 32px; color: #444; line-height: 1.6;">
          <li>✅ <strong>Completed:</strong> ${completedCount}</li>
          <li>❌ <strong style="color: #DC2626;">Cancelled:</strong> ${cancelledCount}</li>
          <li>⏳ <strong>Unfinished/Active:</strong> ${activeCount}</li>
          <li>🛍️ <strong>Pickup:</strong> ${pickupCount} | 🍽️ <strong>Dine-In:</strong> ${dineInCount}</li>
        </ul>

        <h3 style="color: #333; margin-bottom: 16px; border-bottom: 2px solid #111; padding-bottom: 8px;">Top 5 Best Sellers</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: left;">Item Name</th>
              <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: center;">Qty Sold</th>
              <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: right;">Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
          Automatically generated by Papicholos System.
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [targetEmail],
        subject: `Papicholos: Daily Sales Report (${new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(new Date())})`,
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend API error: ${err}`)
    }

    return new Response(JSON.stringify({ message: 'Daily stats emailed successfully', ordersProcessed: todayOrders.length }), {
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
