import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

type ApprovalsItem = {
  id: string; number: string; vendor_name: string; total: number; currency: string;
  policyFailures: string[]; fraudFlags: { kind: string; score: number }[];
}

export default function ApprovalsPage() {
  const [items,setItems]=useState<ApprovalsItem[]>([])
  useEffect(() => {
    supabase.functions.invoke("policy_engine", { body: { list: true }}).then(({ data }) => setItems(data?.items ?? []))
  }, [])

  async function approve(id:string){
    const { error } = await supabase.functions.invoke("policy_engine", { body: { approve: true, id } })
    if (error) return alert(error.message)
    location.reload()
  }
  async function toHIL(id:string){
    await supabase.functions.invoke("fraud_detect", { body: { route_hil: true, id } })
    location.reload()
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Approvals</h1>
      <ul className="space-y-3">
        {items.map(it=>(
          <li key={it.id} className="p-4 rounded-xl border">
            <div className="flex justify-between gap-4">
              <div>
                <div className="font-medium">Invoice {it.number}</div>
                <div className="text-sm text-gray-500">
                  Vendor {it.vendor_name} • {it.total} {it.currency}
                </div>
                {it.policyFailures?.length>0 && <div className="text-red-700 text-sm mt-1">Policy blocks: {it.policyFailures.join(", ")}</div>}
                {it.fraudFlags?.length>0 && <div className="text-amber-700 text-sm">Fraud flags: {it.fraudFlags.map(f=>`${f.kind}(${f.score})`).join(", ")}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn" disabled={it.policyFailures?.length>0} onClick={()=>approve(it.id)}>Approve</button>
                <button className="btn-outline" onClick={()=>toHIL(it.id)}>Send to HIL</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}