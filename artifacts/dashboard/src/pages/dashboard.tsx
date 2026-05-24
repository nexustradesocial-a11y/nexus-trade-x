import { useGetBotStatus, useStartBot, useStopBot, useGetBotStats, useGetActivity, getGetBotStatusQueryKey, getGetActivityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Activity as ActivityIcon, MessageSquare, Users, BarChart3, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: isStatusLoading } = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey() } });
  const { data: stats, isLoading: isStatsLoading } = useGetBotStats();
  const { data: activity, isLoading: isActivityLoading } = useGetActivity({ limit: 5 }, { query: { queryKey: getGetActivityQueryKey({ limit: 5 }) } });

  const startBot = useStartBot({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() })
    }
  });

  const stopBot = useStopBot({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() })
    }
  });

  const isRunning = status?.running || false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Terminal</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium font-mono">
              {isStatusLoading ? "LOADING..." : isRunning ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
            </span>
          </div>
          <Button 
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={() => isRunning ? stopBot.mutate() : startBot.mutate()}
            disabled={startBot.isPending || stopBot.isPending || isStatusLoading}
            className="font-mono uppercase"
            data-testid="button-toggle-bot"
          >
            {isRunning ? (
              <><PowerOff className="w-4 h-4 mr-2" /> Halt System</>
            ) : (
              <><Power className="w-4 h-4 mr-2" /> Initialize</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Uptime</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isStatusLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">
                {status?.startedAt ? formatDistanceToNow(new Date(status.startedAt)) : "0m"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Posts</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalPosts || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Replies</CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalReplies || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Influencer Engagements</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalInfluencerReplies || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono uppercase tracking-wider flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-primary" /> 24H Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
               <div className="space-y-4">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
               </div>
            ) : (
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">POSTS</span>
                  <span className="text-primary">{stats?.last24hPosts || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">REPLIES</span>
                  <span className="text-primary">{stats?.last24hReplies || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono uppercase tracking-wider">Live Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map(log => (
                  <div key={log.id} className="text-sm font-mono flex items-start gap-3 p-2 rounded bg-muted/30 border border-border/50">
                    <Badge variant={log.type === 'post' ? 'default' : log.type === 'reply' ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                      {log.type}
                    </Badge>
                    <div className="flex-1 truncate">
                      <div className="text-muted-foreground truncate">{log.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground font-mono text-sm">NO ACTIVITY FOUND</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
