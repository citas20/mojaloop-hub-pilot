import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { createParticipant, setInitialPositionAndLimits, createParticipantEndpoint, recordFunds, getParticipantAccounts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

const REQUIRED_ENDPOINTS = [
  "FSPIOP_CALLBACK_URL_TRANSFER_POST",
  "FSPIOP_CALLBACK_URL_TRANSFER_PUT",
  "FSPIOP_CALLBACK_URL_TRANSFER_PUT_ERROR",
  "FSPIOP_CALLBACK_URL_QUOTES",
  "FSPIOP_CALLBACK_URL_PARTICIPANT_PUT",
  "FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR",
];

type StepStatus = "pending" | "loading" | "success" | "error";

interface Step {
  label: string;
  status: StepStatus;
  error?: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [ndcValue, setNdcValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [fundsAmount, setFundsAmount] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { label: "Criar Participante", status: "pending" },
    { label: "Definir NDC Inicial", status: "pending" },
    { label: "Registar Endpoints", status: "pending" },
    { label: "Depósito Inicial", status: "pending" },
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function updateStep(idx: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function runOnboarding() {
    if (!name.trim() || !ndcValue || !baseUrl.trim() || !fundsAmount) {
      toast.error("Preencha todos os campos");
      return;
    }
    setRunning(true);
    let ok = true;

    // Step 1 — Create participant
    updateStep(0, { status: "loading" });
    try {
      await createParticipant(name.trim());
      updateStep(0, { status: "success" });
    } catch (e: any) {
      updateStep(0, { status: "error", error: e.message });
      ok = false;
    }

    if (!ok) { setRunning(false); return; }

    // Step 2 — Set NDC
    updateStep(1, { status: "loading" });
    try {
      await setInitialPositionAndLimits(name.trim(), "CVE", parseFloat(ndcValue));
      updateStep(1, { status: "success" });
    } catch (e: any) {
      updateStep(1, { status: "error", error: e.message });
      ok = false;
    }

    if (!ok) { setRunning(false); return; }

    // Step 3 — Register endpoints
    updateStep(2, { status: "loading" });
    try {
      for (const type of REQUIRED_ENDPOINTS) {
        await createParticipantEndpoint(name.trim(), type, `${baseUrl.trim()}/${type.toLowerCase()}`);
      }
      updateStep(2, { status: "success" });
    } catch (e: any) {
      updateStep(2, { status: "error", error: e.message });
      ok = false;
    }

    if (!ok) { setRunning(false); return; }

    // Step 4 — Funds In
    updateStep(3, { status: "loading" });
    try {
      const accounts = await getParticipantAccounts(name.trim());
      const settlementAccount = (Array.isArray(accounts) ? accounts : []).find(
        (a: any) => a.ledgerAccountType === "SETTLEMENT" || a.ledgerAccountType === "POSITION"
      );
      if (!settlementAccount) throw new Error("Conta não encontrada");
      await recordFunds(name.trim(), settlementAccount.id, {
        transferId: uuidv4(),
        externalReference: `onboarding-${name.trim()}`,
        action: "recordFundsIn",
        reason: "Depósito inicial de onboarding",
        amount: { amount: parseFloat(fundsAmount), currency: "CVE" },
      });
      updateStep(3, { status: "success" });
    } catch (e: any) {
      updateStep(3, { status: "error", error: e.message });
      ok = false;
    }

    setRunning(false);
    if (ok) {
      setDone(true);
      toast.success(`Onboarding de "${name}" concluído com sucesso!`);
    }
  }

  function reset() {
    setName("");
    setNdcValue("");
    setBaseUrl("");
    setFundsAmount("");
    setCurrentStep(0);
    setDone(false);
    setSteps([
      { label: "Criar Participante", status: "pending" },
      { label: "Definir NDC Inicial", status: "pending" },
      { label: "Registar Endpoints", status: "pending" },
      { label: "Depósito Inicial", status: "pending" },
    ]);
  }

  const statusIcon = (s: StepStatus) => {
    if (s === "loading") return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    if (s === "success") return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (s === "error") return <XCircle className="h-5 w-5 text-destructive" />;
    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Onboarding de Novo Banco</h1>
        <p className="page-subtitle">Wizard passo a passo para configurar um novo participante</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold">Configuração</h2>
          <div>
            <Label>Nome do Participante</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: bankXYZ" disabled={running || done} />
          </div>
          <div>
            <Label>Limite NDC Inicial (CVE)</Label>
            <Input type="number" value={ndcValue} onChange={(e) => setNdcValue(e.target.value)} placeholder="1000000" disabled={running || done} />
          </div>
          <div>
            <Label>Base URL para Callbacks</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://bank.example.com" disabled={running || done} />
          </div>
          <div>
            <Label>Depósito Inicial (CVE)</Label>
            <Input type="number" value={fundsAmount} onChange={(e) => setFundsAmount(e.target.value)} placeholder="500000" disabled={running || done} />
          </div>
          {!done ? (
            <Button onClick={runOnboarding} disabled={running} className="w-full">
              {running ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A processar...</>
              ) : (
                <><ArrowRight className="h-4 w-4 mr-2" /> Iniciar Onboarding</>
              )}
            </Button>
          ) : (
            <Button onClick={reset} variant="outline" className="w-full">Novo Onboarding</Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold mb-4">Progresso</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {statusIcon(step.status)}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.status === "success" ? "text-success" : step.status === "error" ? "text-destructive" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  {step.error && <p className="text-xs text-destructive mt-1">{step.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
