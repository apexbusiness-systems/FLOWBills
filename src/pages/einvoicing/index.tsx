import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { EinvoiceVM } from "../../lib/types"

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function EinvoicingPage() {
  const [xml, setXml] = useState<string>("")
  const [doc, setDoc] = useState<EinvoiceVM | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  async function onValidate() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke("einvoice_validate", {
      body: { xml }  // Edge Function expects JSON; supabase-js sets headers automatically
    })
    setBusy(false)
    if (error) return alert(`Validate failed: ${error.message}`)
    setValid(!!data?.passed)
    setIssues(data?.issues ?? [])
    setDoc(data?.doc ?? null)
  }

  async function onSend() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke("einvoice_send", {
      body: { docId: doc?.id }
    })
    setBusy(false)
    if (error) return alert(`Send failed: ${error.message}`)
    alert("Queued for Peppol send")
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">E-Invoicing</h1>
      <textarea className="w-full min-h-48 border rounded p-3" placeholder="Paste BIS/XRechnung/Factur-X XML" value={xml} onChange={e=>setXml(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={onValidate} disabled={!xml || busy}>Validate</button>
        <button className="btn" onClick={onSend} disabled={!valid || !doc || busy}>Send via Peppol AP</button>
      </div>
      {valid !== null && (
        <div className="mt-4">
          <div className={valid ? "text-green-700" : "text-red-700"}>
            {valid ? "Validation passed" : "Validation failed"}
          </div>
          {!valid && issues.length > 0 && (
            <ul className="list-disc pl-6 mt-2">{issues.map((i,idx)=><li key={idx}>{i}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  )
}