import { useState } from "react";
import { getTransaction } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function TransfersPage() {
  const [transferId, setTransferId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSearch() {
    if (!transferId.trim()) { toast.error("Insira um transferId"); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await getTransaction(transferId.trim());
      setResult(data);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Consulta de Transferências</h1>
        <p className="page-subtitle">Pesquisar transferências por ID</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-end gap-4 max-w-xl">
          <div className="flex-1">
            <Label>Transfer ID</Label>
            <Input
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" /> Pesquisar
          </Button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {result && (
        <div className="bg-card rounded-xl border border-border p-6 animate-fade-in" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-semibold mb-4">Resultado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Payer FSP:</span>
              <p className="font-medium">{result.payerFsp || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Payee FSP:</span>
              <p className="font-medium">{result.payeeFsp || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Montante:</span>
              <p className="font-mono font-medium">{result.amount?.amount ?? result.amount ?? "—"} {result.amount?.currency ?? result.currency ?? ""}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <p><Badge variant={result.transferState === "COMMITTED" ? "default" : "secondary"}>{result.transferState || "—"}</Badge></p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Concluído em:</span>
              <p className="font-medium">{result.completedTimestamp ? new Date(result.completedTimestamp).toLocaleString("pt-CV") : "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
