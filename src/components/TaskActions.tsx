import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Play, CheckCircle, CreditCard, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface TaskActionsProps {
  task: Task;
  isOwner: boolean;
  isAssignedTasker: boolean;
  onUpdate: () => void;
}

const TaskActions = ({ task, isOwner, isAssignedTasker, onUpdate }: TaskActionsProps) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const status = task.status as string;

  // Customer: Confirm work started (assigned -> in_progress)
  const handleConfirmStart = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Arbetet har startat!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte uppdatera status");
    } finally {
      setProcessing(false);
    }
  };

  // Tasker: Mark completed (in_progress -> completed_pending_release)
  const handleMarkCompleted = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed_pending_release" })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Uppdraget är markerat som slutfört!", {
        description: "Väntar på att kunden godkänner och släpper betalningen.",
      });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte uppdatera status");
    } finally {
      setProcessing(false);
    }
  };

  // Customer: Release payment (completed_pending_release -> paid)
  const handleReleasePayment = async () => {
    setProcessing(true);
    try {
      // Update task status
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "paid" })
        .eq("id", task.id);

      if (taskError) throw taskError;

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "released" })
        .eq("task_id", task.id);

      toast.success("Betalning släppt!", {
        description: "Pengarna har skickats till taskern.",
      });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte släppa betalning");
    } finally {
      setProcessing(false);
    }
  };

  // Customer: Cancel task (before acceptance)
  const handleCancelTask = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "cancelled" })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Uppdraget har avbrutits");
      navigate("/my-tasks");
    } catch (error: any) {
      toast.error(error.message || "Kunde inte avbryta uppdraget");
    } finally {
      setProcessing(false);
    }
  };

  // Customer: Request dispute (after acceptance)
  const handleRequestDispute = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "disputed" })
        .eq("id", task.id);

      if (error) throw error;

      // Update payment to refunded status
      await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("task_id", task.id);

      toast.success("Tvist registrerad", {
        description: "Vi kommer att granska ärendet.",
      });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte registrera tvist");
    } finally {
      setProcessing(false);
    }
  };

  const canCancel = isOwner && ["published", "instant_open", "draft"].includes(status);
  const canDispute = isOwner && ["assigned", "in_progress", "completed_pending_release"].includes(status);
  const canConfirmStart = isOwner && status === "assigned";
  const canMarkCompleted = isAssignedTasker && status === "in_progress";
  const canReleasePayment = isOwner && status === "completed_pending_release";

  if (!canCancel && !canDispute && !canConfirmStart && !canMarkCompleted && !canReleasePayment) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Customer: Confirm start */}
      {canConfirmStart && (
        <Button
          variant="hero"
          size="lg"
          className="w-full gap-2"
          onClick={handleConfirmStart}
          disabled={processing}
        >
          <Play size={18} />
          Bekräfta att arbetet börjat
        </Button>
      )}

      {/* Tasker: Mark completed */}
      {canMarkCompleted && (
        <Button
          variant="hero"
          size="lg"
          className="w-full gap-2"
          onClick={handleMarkCompleted}
          disabled={processing}
        >
          <CheckCircle size={18} />
          Markera som slutfört
        </Button>
      )}

      {/* Customer: Release payment */}
      {canReleasePayment && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="hero" size="lg" className="w-full gap-2" disabled={processing}>
              <CreditCard size={18} />
              Godkänn och släpp betalning
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bekräfta betalning</AlertDialogTitle>
              <AlertDialogDescription>
                Är du nöjd med arbetet? När du släpper betalningen skickas pengarna 
                till taskern och kan inte återkallas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleReleasePayment}>
                Ja, släpp betalningen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel (before acceptance) */}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive" disabled={processing}>
              <XCircle size={16} />
              Avbryt uppdrag
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Avbryt uppdrag?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill avbryta detta uppdrag? 
                Alla bud kommer att raderas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Nej, behåll</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelTask} className="bg-destructive hover:bg-destructive/90">
                Ja, avbryt
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dispute (after acceptance) */}
      {canDispute && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive" disabled={processing}>
              <AlertTriangle size={16} />
              Rapportera problem
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rapportera problem?</AlertDialogTitle>
              <AlertDialogDescription>
                Om du har problem med uppdraget kan du öppna en tvist. 
                Vi kommer att granska ärendet och hjälpa till att lösa det.
                <br /><br />
                <strong>Obs:</strong> Betalningen kommer att spärras tills tvisten är löst.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleRequestDispute} className="bg-destructive hover:bg-destructive/90">
                Öppna tvist
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default TaskActions;
