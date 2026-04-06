import { useEffect, useState } from "react";
import { getParticipants, getParticipantPositions, getParticipantLimits, getSettlementWindows } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Users, AlertTriangle, Landmark, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ParticipantPosition {
  name: string;
  isActive: boolean;
  position: number;
  currency: string;
  ndcLimit: number;
  ndcUsage: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [positions, setPositions] = useState<ParticipantPosition[]>([]);
  const [openWindows, setOpenWindows] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [parts, windows] = await Promise.all([
        getParticipants().catch(() => []),
        getSettlementWindows("OPEN").catch(() => []),
      ]);
      
      const filtered = (parts || []).filter(
        (p: any) => p.name !== "Hub" && p.name !== "hub"
      );
      setParticipants(filtered);
      setOpenWindows(Array.isArray(windows) ? windows.length : 0);

      const posData: ParticipantPosition[] = [];
      for (const p of filtered.slice(0, 20)) {
        try {
          const [pos, limits] = await Promise.all([
            getParticipantPositions(p.name).catch(() => []),
            getParticipantLimits(p.name).catch(() => []),
          ]);
          const posArr = Array.isArray(pos) ? pos : [];
          const limArr = Array.isArray(limits) ? limits : [];
          const posItem = posArr[0];
          const limItem = limArr.find((l: any) => l.limit?.type === "NET_DEBIT_CAP");
          posData.push({
            name: p.name,
            isActive: p.isActive !== false,
            position: posItem?.value ?? 0,
            currency: posItem?.currency ?? "CVE",
            ndcLimit: limItem?.limit?.value ?? 0,
            ndcUsage: limItem?.limit?.value ? Math.abs(posItem?.value ?? 0) / limItem.limit.value * 100 : 0,
          });
        } catch {
          posData.push({
            name: p.name, isActive: p.isActive !== false,
            position: 0, currency: "CVE", ndcLimit: 0, ndcUsage: 0,
          });
        }
      }
      setPositions(posData);
    } catch (e: any) {
      toast.error("Erro ao carregar dashboard: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const activeCount = participants.filter((p) => p.isActive !== false).length;
  const openPositions = positions.filter((p) => p.position !== 0).length;
  const alertCount = positions.filter((p) => p.ndcUsage > 80).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Visão geral do Hub Mojaloop</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Participantes Ativos" value={activeCount} icon={Users} />
        <StatCard title="Posições Abertas" value={openPositions} icon={TrendingUp} variant="default" />
        <StatCard title="Settlements Pendentes" value={openWindows} icon={Landmark} variant="warning" />
        <StatCard
          title="Alertas NDC"
          value={alertCount}
          icon={AlertTriangle}
          variant={alertCount > 0 ? "destructive" : "success"}
          description={alertCount > 0 ? "Participantes >80% NDC" : "Tudo normal"}
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Posições dos Participantes</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Posição</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Limite NDC</TableHead>
                <TableHead className="text-right">Uso NDC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum participante encontrado
                  </TableCell>
                </TableRow>
              )}
              {positions.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono ${p.position > 0 ? "text-destructive" : p.position < 0 ? "text-success" : ""}`}>
                    {p.position.toLocaleString("pt-CV")}
                  </TableCell>
                  <TableCell>{p.currency}</TableCell>
                  <TableCell className="text-right font-mono">
                    {p.ndcLimit.toLocaleString("pt-CV")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.ndcUsage > 80 ? "bg-destructive" : p.ndcUsage > 50 ? "bg-warning" : "bg-success"
                          }`}
                          style={{ width: `${Math.min(p.ndcUsage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${p.ndcUsage > 80 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        {p.ndcUsage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
