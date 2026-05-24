import { useGetBotConfig, useSaveBotConfig, getGetBotConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { CheckCircle2, Save, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const configSchema = z.object({
  xApiKey: z.string().optional(),
  xApiSecret: z.string().optional(),
  xAccessToken: z.string().optional(),
  xAccessSecret: z.string().optional(),
  openAiKey: z.string().optional(),
  xaiKey: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function Config() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetBotConfig({ query: { queryKey: getGetBotConfigQueryKey() } });
  const saveConfig = useSaveBotConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Configuration saved successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBotConfigQueryKey() });
        form.reset({
            xApiKey: "",
            xApiSecret: "",
            xAccessToken: "",
            xAccessSecret: "",
            openAiKey: "",
            xaiKey: "",
        });
      },
      onError: () => {
        toast({ title: "Failed to save configuration", variant: "destructive" });
      }
    }
  });

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      xApiKey: "",
      xApiSecret: "",
      xAccessToken: "",
      xAccessSecret: "",
      openAiKey: "",
      xaiKey: "",
    },
  });

  function onSubmit(data: ConfigFormValues) {
    // Only send fields that have been inputted (not empty)
    const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
    );
    saveConfig.mutate({ data: payload });
  }

  const StatusIndicator = ({ isSet }: { isSet?: boolean }) => (
    isSet ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground font-mono mt-2">Manage API keys and authentication credentials.</p>
      </div>

      <Card className="bg-card border-border max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> Credentials
          </CardTitle>
          <CardDescription>
            Input new keys to update them. Existing keys are masked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
               <div className="h-10 bg-muted animate-pulse rounded" />
               <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-mono font-medium border-b border-border pb-2">X / Twitter API</h3>
                        
                        <FormField control={form.control} name="xApiKey" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">API Key</FormLabel>
                            <StatusIndicator isSet={config?.hasXApiKey} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasXApiKey ? "••••••••••••••••" : "Enter API Key"} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />

                        <FormField control={form.control} name="xApiSecret" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">API Secret</FormLabel>
                            <StatusIndicator isSet={config?.hasXApiSecret} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasXApiSecret ? "••••••••••••••••" : "Enter API Secret"} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />

                        <FormField control={form.control} name="xAccessToken" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">Access Token</FormLabel>
                            <StatusIndicator isSet={config?.hasXAccessToken} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasXAccessToken ? "••••••••••••••••" : "Enter Access Token"} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />

                        <FormField control={form.control} name="xAccessSecret" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">Access Secret</FormLabel>
                            <StatusIndicator isSet={config?.hasXAccessSecret} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasXAccessSecret ? "••••••••••••••••" : "Enter Access Secret"} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-mono font-medium border-b border-border pb-2">AI Providers</h3>
                        
                        <FormField control={form.control} name="openAiKey" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">OpenAI Key</FormLabel>
                            <StatusIndicator isSet={config?.hasOpenAiKey} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasOpenAiKey ? "••••••••••••••••" : "sk-..."} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />

                        <FormField control={form.control} name="xaiKey" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel className="font-mono">xAI Key</FormLabel>
                            <StatusIndicator isSet={config?.hasXaiKey} />
                            </div>
                            <FormControl>
                            <Input type="password" placeholder={config?.hasXaiKey ? "••••••••••••••••" : "Enter xAI Key"} className="font-mono bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button type="submit" disabled={saveConfig.isPending} className="font-mono uppercase" data-testid="button-save-config">
                    <Save className="w-4 h-4 mr-2" /> Save Configuration
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
