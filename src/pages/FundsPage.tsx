import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getParticipants, getParticipantAccounts, recordFunds } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function FundsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getParticipants()
      .then((d) => setParticipants((d || []).filter((p: any) => p.name !== "Hub" && p.name !== "hub")))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadAccounts(name: string) {
    setSelectedParticipant(name);
    setSelectedAccount("");
    setLoadingAccounts(true);
    try {
      const data = await getParticipantAccounts(name);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoadingAccounts(false);
  }

  async function handleSubmit(action: "recordFundsIn" | "recordFundsOutPrepareReserve") {
    const val = parseFloat(amount);
    if (!selectedParticipant || !selectedAccount || isNaN(val) || val <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }
    setSubmitting(true);
    try {
      await recordFunds(selectedParticipant, selectedAccount, {
        transferId: uuidv4(),
        externalReference: externalRef || uuidv4(),
        action,
        reason: reason || (action === "recordFundsIn" ? "Depósito" : "Levantamento"),
        amount: { amount: val, currency: "CVE" },
      });
      toast.success(action === "recordFundsIn" ? "Depósito registado com sucesso" : "Levantamento registado com sucesso");
      setAmount("");
      setExternalRef("");
      setReason("");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSubmitting(false);
  }

  if (loading) return <LoadingSpinner />;

  const formContent = (action: "recordFundsIn" | "recordFundsOutPrepareReserve") => (
    <div className="space-y-4 max-w-lg">
      <div>
        <Label>Participante</Label>
        <Select value={selectedParticipant} onValueChange={loadAccounts}>
          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
          <SelectContent>
            {participants.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Conta</Label>
        {loadingAccounts ? <LoadingSpinner className="py-2" /> : (
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger><SelectValue placeholder="Selecionar conta..." /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.id} — {a.ledgerAccountType} ({a.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div>
        <Label>Montante (CVE)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </div>
      <div>
        <Label>Referência Externa (opcional)</Label>
        <Input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="Gerado automaticamente" />
      </div>
      <div>
        <Label>Motivo (opcional)</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="..." />
      </div>
      <Button onClick={() => handleSubmit(action)} disabled={submitting} className="w-full">
        {submitting ? "A processar..." : action === "recordFundsIn" ? "Registar Depósito" : "Registar Levantamento"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Fundos In / Out</h1>
        <p className="page-subtitle">Registar depósitos e levantamentos</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <Tabs defaultValue="in">
          <TabsList>
            <TabsTrigger value="in">Funds In (Depósito)</TabsTrigger>
            <TabsTrigger value="out">Funds Out (Levantamento)</TabsTrigger>
          </TabsList>
          <TabsContent value="in" className="mt-6">{formContent("recordFundsIn")}</TabsContent>
          <TabsContent value="out" className="mt-6">{formContent("recordFundsOutPrepareReserve")}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
