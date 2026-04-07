"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Settings2, 
  Loader2, 
  Search,
  MessageSquare,
  Sparkles,
  Zap
} from "lucide-react";
// import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Config } from "@/lib/types";

export default function ConfigsPage() {
  const { token } = useAuth();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Config | null>(null);
  const [form, setForm] = useState({ 
    configName: "", 
    creatorsCategory: "",
    analysisInstruction: "",
    newConceptsInstruction: ""
  });
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConfigs = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/configs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setConfigs(data);
      }
    } catch (err) {
      alert("Failed to load configurations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadConfigs();
  }, [token]);

  const filteredConfigs = configs.filter((c) => 
    c.configName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.creatorsCategory?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ 
      configName: "", 
      creatorsCategory: "",
      analysisInstruction: "",
      newConceptsInstruction: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (config: Config) => {
    setEditing(config);
    setForm({ 
      configName: config.configName, 
      creatorsCategory: config.creatorsCategory || "",
      analysisInstruction: config.analysisInstruction,
      newConceptsInstruction: config.newConceptsInstruction
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.configName || !form.analysisInstruction || !form.newConceptsInstruction) {
      alert("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/configs/${editing.configName}` : "/api/configs";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Save failed");

      alert(editing ? "Configuration updated" : "Configuration created");
      setDialogOpen(false);
      loadConfigs();
    } catch (err) {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!description.trim()) {
      alert("Please provide a brand or category description first.");
      return;
    }
    
    if (form.analysisInstruction || form.newConceptsInstruction) {
      if (!confirm("This will overwrite your current instructions. Continue?")) return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/configs/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      setForm(prev => ({
        ...prev,
        analysisInstruction: data.analysisInstruction,
        newConceptsInstruction: data.newConceptsInstruction
      }));
    } catch (err) {
      alert("Failed to generate instructions with AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (configName: string) => {
    if (!confirm(`Are you sure you want to delete config "${configName}"?`)) return;
    try {
      const response = await fetch(`/api/configs/${configName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      alert("Configuration deleted");
      loadConfigs();
    } catch (err) {
      alert("Failed to delete configuration");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            Reel Configs
            <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-purple-400 border-purple-500/20 bg-purple-500/5 px-2">Intelligence</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage Instagram analysis and concept generation guidelines
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="w-full sm:w-auto rounded-xl h-10 sm:h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 gap-2 shadow-lg shadow-purple-500/20 px-6 text-xs sm:text-sm">
              <Plus className="h-4 w-4" />
              New Config
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[750px] max-h-[90vh] glass-strong border-white/[0.08] rounded-2xl p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 sm:p-6 border-b border-white/[0.05]">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  {editing ? <Pencil className="h-5 w-5 text-purple-400" /> : <Plus className="h-5 w-5 text-purple-400" />}
                  {editing ? "Update Prompt" : "New Configuration"}
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <ScrollArea className="max-h-[80vh]">
              <div className="p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Config Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Dubai Luxury Real Estate"
                      value={form.configName}
                      onChange={(e) => setForm({ ...form, configName: e.target.value })}
                      className="rounded-xl glass border-white/[0.08] h-11 text-sm focus:ring-purple-500/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Creators Category (Optional)</Label>
                    <Input
                      id="category"
                      placeholder="e.g. real-estate"
                      value={form.creatorsCategory}
                      onChange={(e) => setForm({ ...form, creatorsCategory: e.target.value })}
                      className="rounded-xl glass border-white/[0.08] h-11 text-sm focus:ring-purple-500/50"
                    />
                  </div>
                </div>
                
                <div className="grid gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="brand-desc" className="text-xs font-bold uppercase tracking-wider text-purple-400 px-1 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Brand / Category Description
                    </Label>
                    <Badge variant="outline" className="text-[9px] uppercase border-purple-500/30 text-purple-400 bg-purple-500/10">AI Powered</Badge>
                  </div>
                  <Textarea
                    id="brand-desc"
                    placeholder="e.g. A high-end demi-fine jewellery brand in India specializing in anti-tarnish gold plating for fashion-conscious urban women..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] rounded-xl glass border-white/[0.08] resize-none p-3 text-sm focus:ring-purple-500/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !description.trim()}
                    className="w-full rounded-xl border-purple-500/30 hover:bg-purple-500/10 text-purple-400 text-xs font-semibold gap-2 h-10 transition-all duration-300 active:scale-95"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 fill-purple-400" />
                    )}
                    {isGenerating ? "Generating Instructions..." : "✨ Generate Instructions with Gemini AI"}
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="analysis" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                    <Zap className="h-3 w-3 text-purple-400" />
                    Analysis Instruction
                  </Label>
                  <Textarea
                    id="analysis"
                    placeholder="Specific instructions for analyzing the viral elements..."
                    value={form.analysisInstruction}
                    onChange={(e) => setForm({ ...form, analysisInstruction: e.target.value })}
                    className="min-h-[200px] rounded-xl glass border-white/[0.08] resize-none p-4 leading-relaxed font-mono text-[13px] focus:ring-purple-500/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="concepts" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    Concept Generation Instruction
                  </Label>
                  <Textarea
                    id="concepts"
                    placeholder="Guidance for creating new hybrid concepts..."
                    value={form.newConceptsInstruction}
                    onChange={(e) => setForm({ ...form, newConceptsInstruction: e.target.value })}
                    className="min-h-[200px] rounded-xl glass border-white/[0.08] resize-none p-4 leading-relaxed font-mono text-[13px] focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 sm:p-6 bg-white/[0.02] border-t border-white/[0.05] flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setDialogOpen(false)}
                className="w-full sm:w-auto rounded-xl px-6 h-10 sm:h-11 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.configName || !form.analysisInstruction || !form.newConceptsInstruction}
                className="w-full sm:w-auto rounded-xl h-10 sm:h-11 min-w-[140px] bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/10 text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editing ? "Save Changes" : "Save Config"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
        <Input
          placeholder="Filter reel configs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 sm:h-11 rounded-xl glass border-white/[0.08] focus:ring-1 focus:ring-purple-500/50 bg-black/20 text-xs sm:text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl glass border-white/[0.08]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500/50" />
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredConfigs.map((config) => (
            <Card key={config.configName} className="group glass border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-500 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/5 flex flex-col">
              <CardHeader className="pb-4 relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(config)}
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 glass border border-transparent hover:border-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(config.configName)}
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 glass border border-transparent hover:border-red-400/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl text-white font-bold group-hover:text-purple-400 transition-colors uppercase tracking-tight">{config.configName}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="rounded-md text-[10px] bg-white/[0.05] border border-white/[0.06] text-muted-foreground">
                      {config.creatorsCategory || "General"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest pl-1">Analysis Focus</p>
                  <ScrollArea className="h-[80px] rounded-xl bg-black/20 border border-white/[0.04] p-3 text-xs text-muted-foreground/80 leading-relaxed font-mono italic">
                    {config.analysisInstruction}
                  </ScrollArea>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">Concept Guidance</p>
                  <ScrollArea className="h-[80px] rounded-xl bg-black/20 border border-white/[0.04] p-3 text-xs text-muted-foreground/80 leading-relaxed font-mono italic">
                    {config.newConceptsInstruction}
                  </ScrollArea>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 flex items-center justify-between border-t border-white/[0.03] mt-2 bg-gradient-to-t from-white/[0.02] to-transparent bg-opacity-20 px-6">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                   <Settings2 className="h-3 w-3" />
                   Pipeline Ready
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                   <span className="text-[10px] text-muted-foreground/60">Active</span>
                 </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 rounded-3xl glass border-white/[0.08] text-center bg-gradient-to-b from-transparent to-purple-500/5 shadow-2xl shadow-inner">
          <div className="h-20 w-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/5 animate-pulse">
            <Zap className="h-10 w-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">No configurations found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
            {searchQuery ? "Try refining your search terms" : "Create your first reel configuration to start generating viral concept strategies."}
          </p>
          {!searchQuery && (
            <Button onClick={openNew} className="mt-10 rounded-xl h-12 px-10 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/20">
              <Plus className="h-5 w-5 mr-2" />
              Get Started
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
