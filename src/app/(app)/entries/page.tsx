import { EntriesPanel } from "@/components/entries/EntriesPanel";
import { EntriesClientHeader } from "@/app/(app)/entries/EntriesClientHeader";

export default function EntriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <EntriesClientHeader />
      <div className="rounded-xl border bg-white p-5">
        <EntriesPanel />
      </div>
    </div>
  );
}
