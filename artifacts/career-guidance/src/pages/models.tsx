import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListModels, useCreateModel, getListModelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Cpu } from "lucide-react";

const modelSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  modelType: z.string().min(1, "Model type is required"),
  description: z.string().optional(),
});

export default function Models() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models, isLoading } = useListModels();
  const createModel = useCreateModel();

  const form = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      modelName: "",
      modelType: "",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof modelSchema>) => {
    createModel.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Model registered successfully" });
        setIsOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to register model", variant: "destructive" });
      }
    });
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      'Prediction': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Classification': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Recommendation': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-muted-foreground" />
            ML Models Admin
          </h1>
          <p className="text-muted-foreground">Manage active machine learning models in the system.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Register Model</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New ML Model</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="modelName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl><Input placeholder="e.g. XGBoost-v2-Placement" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="modelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Prediction">Prediction</SelectItem>
                        <SelectItem value="Classification">Classification</SelectItem>
                        <SelectItem value="Recommendation">Recommendation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Model details and version info..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createModel.isPending}>
                    {createModel.isPending ? "Registering..." : "Register Model"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                </TableRow>
              ))
            ) : models?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No models registered yet.
                </TableCell>
              </TableRow>
            ) : (
              models?.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    {model.modelName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 ${getTypeBadge(model.modelType)}`}>
                      {model.modelType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-md">
                    {model.description || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}