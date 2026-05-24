import { useGetActivity, getGetActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GetActivityType } from "@workspace/api-zod/src/generated/types";

export default function Activity() {
  const [filterType, setFilterType] = useState<string>("all");
  const params = filterType === "all" ? undefined : { type: filterType as GetActivityType };
  const { data: activity, isLoading } = useGetActivity(params, { query: { queryKey: getGetActivityQueryKey(params) } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground font-mono mt-2">Comprehensive audit trail of automated actions.</p>
        </div>
        <div className="w-full md:w-64">
           <Select value={filterType} onValueChange={setFilterType}>
             <SelectTrigger className="font-mono">
               <SelectValue placeholder="Filter by type" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">ALL TYPES</SelectItem>
               <SelectItem value="post">POST</SelectItem>
               <SelectItem value="reply">REPLY</SelectItem>
               <SelectItem value="influencer_reply">INFLUENCER REPLY</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <ActivityIcon className="w-4 h-4" /> Operations History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="divide-y divide-border/50">
              {activity.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex items-center gap-2 md:w-48 shrink-0">
                    {log.success !== false ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.type === 'post' ? 'default' : log.type === 'reply' ? 'secondary' : 'outline'} className="uppercase text-[10px] tracking-wider rounded-sm">
                        {log.type.replace('_', ' ')}
                      </Badge>
                      {log.targetUser && (
                        <span className="font-mono text-xs text-primary">@{log.targetUser}</span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-foreground leading-relaxed bg-background/50 p-3 rounded border border-border/50">
                      {log.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground font-mono">
               NO ACTIVITY LOGS FOUND
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
