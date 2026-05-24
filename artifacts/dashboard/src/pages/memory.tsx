import { useGetBotMemory, getGetBotMemoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Memory() {
  const { data: memory, isLoading } = useGetBotMemory({ query: { queryKey: getGetBotMemoryQueryKey() } });
  const [search, setSearch] = useState("");

  const filteredMemory = memory?.filter(m => 
    m.user.toLowerCase().includes(search.toLowerCase()) || 
    m.question.toLowerCase().includes(search.toLowerCase()) ||
    m.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memory Bank</h1>
          <p className="text-muted-foreground font-mono mt-2">Stored interactions and knowledge context.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9 font-mono bg-card" 
            placeholder="Search queries, users, answers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <Database className="w-4 h-4" /> Context Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredMemory && filteredMemory.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredMemory.map(entry => (
                <div key={entry.id} className="p-4 hover:bg-muted/10 transition-colors space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">
                      USER: @{entry.user}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ID: {entry.id.toString().padStart(6, '0')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">QUERY</div>
                      <div className="text-sm font-mono bg-background/50 p-3 rounded border border-border/50 h-full">
                        {entry.question}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">RESPONSE</div>
                      <div className="text-sm font-mono bg-primary/5 p-3 rounded border border-primary/20 text-primary-foreground h-full">
                        {entry.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground font-mono">
               {search ? "NO MATCHING ENTRIES" : "MEMORY BANK EMPTY"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
