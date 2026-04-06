import { useEffect, useState } from "react";
import { getSettlementModels, getSettlementWindows, closeSettlementWindow } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RefreshCw, XCircle } from "lucide-react";

export default function SettlementPage() {
  const [models, setModels] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeId, setCloseId] = useState<string | number>("");
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, w] = await Promise.all([
        getSettlementModels().catch(() => []),
        getSettlementWindows("OPEN").catch(() => []),
      ]);
      setModels(Array.isArray(m) ? m : []);
      setWindows(Array.isArray(w) ? w : []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  async function handleClose() {
    if (!closeReason.trim()) { toast.error("Insira um motivo"); return; }
    setClosing(true);
    try {
      await closeSettlementWindow(closeId, closeReason.trim());
      toast.success("Janela fechada");
      setCloseOpen(false);
      setCloseReason("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setClosing(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header">Settlement</h1>
          <p className="page-subtitle">Modelos e janelas de settlement</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <Tabs defaultValue="windows">
          <div className="px-5 pt-4"><TabsList><TabsTrigger value="windows">Janelas Abertas</TabsTrigger><TabsTrigger value="models">Modelos</TabsTrigger></TabsList></div>
          <TabsContent value="windows" className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {windows.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem janelas abertas</TableCell></TableRow>
                  )}
                  {windows.map((w: any) => (
                    <TableRow key={w.settlementWindowId}>
                      <TableCell className="font-mono">{w.settlementWindowId}</TableCell>
                      <TableCell><Badge>{w.state}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {w.createdDate ? new Date(w.createdDate).toLocaleString("pt-CV") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => { setCloseId(w.settlementWindowId); setCloseOpen(true); }}>
                          <XCircle className="h-4 w-4 mr-1" /> Fechar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="models" className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Granularidade</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem modelos</TableCell></TableRow>
                  )}
                  {models.map((m: any) => (
                    <TableRow key={m.settlementModelId}>
                      <TableCell className="font-mono">{m.settlementModelId}</TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.settlementGranularity}</TableCell>
                      <TableCell>{m.settlementInterchange}</TableCell>
                      <TableCell><Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Sim" : "Não"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fechar Janela #{closeId}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo</Label>
              <Input value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="Motivo do encerramento" />
            </div>
            <Button onClick={handleClose} disabled={closing} variant="destructive" className="w-full">
              {closing ? "A fechar..." : "Confirmar Encerramento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
