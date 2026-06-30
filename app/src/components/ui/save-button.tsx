import { useState } from "react";
import { Button } from "./button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { BASE_URL } from "@/lib/config";

interface SaveButtonProps {
  itemType: "reel" | "ad" | "instagram" | "linkedin";
  itemId: string | number;
  initialIsSaved?: boolean;
  showText?: boolean;
}

export function SaveButton({ itemType, itemId, initialIsSaved = false, showText = false }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const toggleSave = async () => {
    if (!token) {
      toast.error("Please login to save items.");
      return;
    }
    
    // Optimistic UI update
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    setLoading(true);

    let endpoint = "";
    let body: any = {};

    if (itemType === "reel") {
      endpoint = `${BASE_URL}/saved/reels`;
      body = { reelId: Number(itemId) };
    } else if (itemType === "ad") {
      endpoint = `${BASE_URL}/saved/ads`;
      body = { adId: String(itemId) };
    } else {
      endpoint = `${BASE_URL}/saved/creators`;
      body = { creatorId: String(itemId), type: itemType };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save");
      }
      
      // Update with actual state from server
      setIsSaved(json.data.saved);
      toast.success(json.data.saved ? "Saved successfully" : "Removed from saved");
    } catch (error) {
      // Revert on failure
      setIsSaved(prevSaved);
      toast.error("Failed to update saved status");
    } finally {
      setLoading(false);
    }
  };

  if (showText) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleSave}
        disabled={loading}
        className={`h-8 gap-2 rounded-lg ${isSaved ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-background/50 border-border/50 text-muted-foreground hover:text-foreground'}`}
      >
        <Save className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
        {isSaved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleSave}
      disabled={loading}
        className={`h-8 w-8 p-0 rounded-lg transition-colors ${isSaved ? 'text-primary hover:text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}
      title={isSaved ? "Remove from saved" : "Save"}
    >
      <Save className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
    </Button>
  );
}
