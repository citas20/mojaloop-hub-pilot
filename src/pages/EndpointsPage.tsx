import { useEffect, useState } from "react";
import { getParticipants, getParticipantEndpoints, createParticipantEndpoint } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";

const ENDPOINT_TYPES = [
  "FSPIOP_CALLBACK_URL_TRANSFER_POST",
  "FSPIOP_CALLBACK_URL_TRANSFER_PUT",
  "FSPIOP_CALLBACK_URL_TRANSFER_PUT_ERROR",
  "FSPIOP_CALLBACK_URL_QUOTES",
  "FSPIOP_CALLBACK_URL_PARTICIPANT_PUT",
  "FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR",
];

export default function EndpointsPage() {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getParticipants()
      .then((d) => setParticipants((d || []).filter((p: any) => p.name !== "Hub" && p.name !== "hub")))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadEndpoints(name: string) {
    setSelected(name);
    setLoadingEndpoints(true);
    try {
      const data = await getParticipantEndpoints(name);
      setEndpoints(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoadingEndpoints(false);
  }

  async function handleAdd() {
    if (!newType || !newValue.trim()) { toast.error("Preencha todos os campos"); return; }
    setAdding(true);
    try {
      await createParticipantEndpoint(selected, newType, newValue.trim());
      toast.success("Endpoint registado");
      setAddOpen(false);
      setNewType("");
      setNewValue("");
      loadEndpoints(selected);
    } catch (e: any) {
      toast.error(e.message);
    }
    setAdding(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Endpoints de Callback</h1>
        <p className="page-subtitle">Gerir endpoints registados por participante</p>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-64">
          <Label>Participante</Label>
          <Select value={selected} onValueChange={loadEndpoints}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selected && (
          <>
            <Button variant="outline" size="icon" onClick={() => loadEndpoints(selected)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Registar Endpoint</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Endpoint — {selected}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger><SelectValue placeholder="Selecionar tipo..." /></SelectTrigger>
                      <SelectContent>
                        {ENDPOINT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="http://..." />
                  </div>
                  <Button onClick={handleAdd} disabled={adding} className="w-full">
                    {adding ? "A registar..." : "Registar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {selected && (
        <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {loadingEndpoints ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Sem endpoints</TableCell></TableRow>
                  )}
                  {endpoints.map((ep, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{ep.type}</TableCell>
                      <TableCell className="text-sm break-all">{ep.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
