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

    // Fetch up to 10,000 recent orders
    const { data: orders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (fetchError) throw fetchError

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No orders to send' }))
    }

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""'
      return '"' + String(str).replace(/"/g, '""') + '"'
    }

    const csvHeader = 'Order ID,Date,Table Number,Customer Name,Status,Payment Method,Item Name,Quantity,Unit Price,Item Total,Order Total,Receipt URL\n'
    
    const rows: string[] = []

    interface OrderItem {
      name: string;
      quantity: number;
      price: number;
    }

    interface OrderRecord {
      id: string;
      created_at: string;
      table_number: string;
      customer_name: string;
      status: string;
      payment_method: string;
      total_price: number;
      receipt_url: string | null;
      order_items: OrderItem[];
    }
    
    orders.forEach((o: OrderRecord) => {
      const dateStr = new Date(o.created_at).toLocaleString()
      const payMethod = o.payment_method === 'gcash' ? 'GCash' : 'Pay at Counter'
      
      if (o.order_items && Array.isArray(o.order_items) && o.order_items.length > 0) {
        o.order_items.forEach((item: OrderItem) => {
          rows.push([
            escapeCsv(o.id),
            escapeCsv(dateStr),
            escapeCsv(o.table_number),
            escapeCsv(o.customer_name),
            escapeCsv(o.status),
            escapeCsv(payMethod),
            escapeCsv(item.name),
            escapeCsv(item.quantity),
            escapeCsv(item.price),
            escapeCsv(String((item.price || 0) * (item.quantity || 1))),
            escapeCsv(o.total_price),
            escapeCsv(o.receipt_url || '')
          ].join(','))
        })
      } else {
        rows.push([
          escapeCsv(o.id),
          escapeCsv(dateStr),
          escapeCsv(o.table_number),
          escapeCsv(o.customer_name),
          escapeCsv(o.status),
          escapeCsv(payMethod),
          '""', '""', '""', '""',
          escapeCsv(o.total_price),
          escapeCsv(o.receipt_url || '')
        ].join(','))
      }
    })

    const csvContent = csvHeader + rows.join('\n')

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bi-monthly Order History</h2>
        <p>Your bi-monthly order history report is ready.</p>
        <p>This report contains data for up to the last 10,000 orders.</p>
        <p>Please find the full order list attached as a CSV file.</p>
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
        subject: 'Papicholos: Bi-Monthly Order History Report',
        html: htmlContent,
        attachments: [
          {
            filename: `order_history_${new Date().toISOString().split('T')[0]}.csv`,
            content: btoa(unescape(encodeURIComponent(csvContent)))
          }
        ]
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend API error: ${err}`)
    }

    // Notice: We intentionally do NOT delete the orders as requested.

    return new Response(JSON.stringify({ message: 'Order history emailed successfully', count: orders.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
