import { useEffect, useState } from "react";
import {
  getParticipants, getParticipant, createParticipant,
  updateParticipant, getParticipantLimits, updateParticipantLimits,
  getParticipantPositions, getParticipantAccounts,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Eye, Power, Edit } from "lucide-react";

export default function ParticipantsPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailAccounts, setDetailAccounts] = useState<any[]>([]);
  const [detailPositions, setDetailPositions] = useState<any[]>([]);
  const [detailLimits, setDetailLimits] = useState<any[]>([]);
  const [editNdc, setEditNdc] = useState("");
  const [editNdcOpen, setEditNdcOpen] = useState(false);
  const [editNdcName, setEditNdcName] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getParticipants();
      setParticipants((data || []).filter((p: any) => p.name !== "Hub" && p.name !== "hub"));
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createParticipant(newName.trim());
      toast.success(`Participante "${newName}" criado`);
      setNewName("");
      setCreateOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setCreating(false);
  }

  async function toggleActive(name: string, current: boolean) {
    try {
      await updateParticipant(name, !current);
      toast.success(`${name} ${!current ? "ativado" : "desativado"}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function showDetail(name: string) {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const [p, acc, pos, lim] = await Promise.all([
        getParticipant(name).catch(() => null),
        getParticipantAccounts(name).catch(() => []),
        getParticipantPositions(name).catch(() => []),
        getParticipantLimits(name).catch(() => []),
      ]);
      setDetail(p);
      setDetailAccounts(Array.isArray(acc) ? acc : []);
      setDetailPositions(Array.isArray(pos) ? pos : []);
      setDetailLimits(Array.isArray(lim) ? lim : []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoadingDetail(false);
  }

  async function handleUpdateNdc() {
    const val = parseFloat(editNdc);
    if (isNaN(val) || val < 0) { toast.error("Valor inválido"); return; }
    try {
      await updateParticipantLimits(editNdcName, val);
      toast.success("Limite NDC atualizado");
      setEditNdcOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header">Participantes</h1>
          <p className="page-subtitle">Gerir participantes do Hub</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Participante</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Participante</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ex: bankXYZ" />
              </div>
              <div>
                <Label>Moeda</Label>
                <Input value="CVE" disabled />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "A criar..." : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive !== false ? "default" : "secondary"}>
                      {p.isActive !== false ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.createdDate ? new Date(p.createdDate).toLocaleDateString("pt-CV") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => showDetail(p.name)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(p.name, p.isActive !== false)}>
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditNdcName(p.name); setEditNdc(""); setEditNdcOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes: {detail?.name}</DialogTitle></DialogHeader>
          {loadingDetail ? <LoadingSpinner /> : (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Contas</h3>
                {detailAccounts.length === 0 ? <p className="text-muted-foreground">Sem contas</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Tipo</TableHead><TableHead>Moeda</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detailAccounts.map((a: any, i: number) => (
                        <TableRow key={i}><TableCell>{a.id}</TableCell><TableCell>{a.ledgerAccountType}</TableCell><TableCell>{a.currency}</TableCell><TableCell className="text-right font-mono">{a.value ?? 0}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Posições</h3>
                {detailPositions.length === 0 ? <p className="text-muted-foreground">Sem posições</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Moeda</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detailPositions.map((pos: any, i: number) => (
                        <TableRow key={i}><TableCell>{pos.currency}</TableCell><TableCell className="text-right font-mono">{pos.value}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Limites</h3>
                {detailLimits.length === 0 ? <p className="text-muted-foreground">Sem limites</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Moeda</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detailLimits.map((l: any, i: number) => (
                        <TableRow key={i}><TableCell>{l.limit?.type}</TableCell><TableCell>{l.currency}</TableCell><TableCell className="text-right font-mono">{l.limit?.value}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit NDC dialog */}
      <Dialog open={editNdcOpen} onOpenChange={setEditNdcOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Limite NDC: {editNdcName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Limite NDC (CVE)</Label>
              <Input type="number" value={editNdc} onChange={(e) => setEditNdc(e.target.value)} placeholder="0" />
            </div>
            <Button onClick={handleUpdateNdc} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
