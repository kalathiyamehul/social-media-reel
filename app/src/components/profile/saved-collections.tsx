import { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/config";
import { useAuth } from "@/context/auth-context";
import { Bookmark, Loader2, Play, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function SavedCollections() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ reels: [], ads: [], creators: [] });
  const [activeTab, setActiveTab] = useState("reels");

  useEffect(() => {
    const fetchSaved = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BASE_URL}/saved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        toast.error("Failed to load saved items");
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8 mt-16 pt-8 border-t border-border/30">
      <div className="flex items-center gap-3 px-4">
        <Bookmark className="h-5 w-5 text-emerald-500" fill="currentColor" />
        <h2 className="text-xl font-bold">Saved Collections</h2>
      </div>

      <div className="flex border-b border-border/30 gap-8 px-4">
        <button 
          onClick={() => setActiveTab("reels")} 
          className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === "reels" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          REELS
        </button>
        <button 
          onClick={() => setActiveTab("ads")} 
          className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === "ads" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          ADS
        </button>
        <button 
          onClick={() => setActiveTab("creators")} 
          className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === "creators" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          CREATORS
        </button>
      </div>

      <div className="min-h-[300px] px-4">
        {activeTab === "reels" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.reels.length === 0 ? (
              <p className="text-muted-foreground col-span-full py-12 text-center text-sm font-medium">No saved reels yet.</p>
            ) : (
              data.reels.map((reel: any) => (
                <a key={reel.id} href={`/analyze?url=${encodeURIComponent(reel.reelUrl)}`} className="group block relative aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border/50">
                  {reel.thumbnailUrl && <img src={reel.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                    <p className="font-bold text-sm truncate">{reel.creator || "Unknown Creator"}</p>
                    <div className="flex items-center gap-3 text-xs mt-1.5 text-white/80 font-medium">
                      <span className="flex items-center gap-1.5"><Play className="h-3.5 w-3.5" fill="currentColor" /> {reel.views}</span>
                      <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" fill="currentColor" /> {reel.likes}</span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === "ads" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.ads.length === 0 ? (
              <p className="text-muted-foreground col-span-full py-12 text-center text-sm font-medium">No saved ads yet.</p>
            ) : (
              data.ads.map((ad: any) => {
                const imgUrl = Array.isArray(ad.images) && ad.images[0] ? ad.images[0] : null;
                return (
                  <div key={ad.adArchiveId} className="group block relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
                     {imgUrl ? (
                       <img src={imgUrl} alt="Ad Thumbnail" className="w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 bg-background">
                         <p className="font-bold text-sm text-foreground truncate w-full">{ad.pageName || "Ad"}</p>
                         <p className="text-[10px] text-muted-foreground font-mono mt-1">{ad.adArchiveId}</p>
                       </div>
                     )}
                     {imgUrl && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">{ad.pageName}</p>
                        </div>
                     )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "creators" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.creators.length === 0 ? (
              <p className="text-muted-foreground col-span-full py-12 text-center text-sm font-medium">No saved creators yet.</p>
            ) : (
              data.creators.map((c: any, i) => {
                const creator = c.data;
                const type = c.type;
                const name = creator?.username || creator?.name || creator?.profileUrl || "Unknown";
                const pic = creator?.profilePicUrl || creator?.profilePic;
                return (
                  <Card key={i} className="p-4 flex items-center gap-4 bg-foreground/[0.02] border-border/50 hover:border-border transition-colors cursor-pointer shadow-sm hover:shadow-md">
                    <div className="h-14 w-14 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {pic ? <img src={pic} alt={name} className="w-full h-full object-cover" /> : <span className="font-bold text-muted-foreground">{name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-foreground">{name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">{type}</p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
