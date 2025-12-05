"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../store";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { EXPENSE_CATEGORIES } from "../../lib/constants";
import { toast } from "react-hot-toast";

interface ExpenseFormProps {
  initialData?: any;
  isEditing?: boolean;
}

const SPLIT_TYPES = [
  { id: "EQUAL", label: "Equal Split (=)" },
  { id: "EXACT", label: "Exact Amount (₹)" },
  { id: "PERCENTAGE", label: "Percentage (%)" },
  { id: "SHARE", label: "Shares (Units)" },
];

export default function ExpenseForm({
  initialData,
  isEditing,
}: ExpenseFormProps) {
  const router = useRouter();
  const { user, addExpense, updateExpense, groups, fetchGroups } = useStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "OTHER",
    date: new Date().toISOString().split("T")[0],
    group_id: "",
    split_type: "EQUAL",
  });

  useEffect(() => {
    fetchGroups();
    if (initialData) {
      setFormData({
        description: initialData.description || "",
        amount: initialData.amount || "",
        category: initialData.category || "OTHER",
        date: new Date(initialData.date).toISOString().split("T")[0],
        group_id: initialData.group?.id || "",
        split_type: initialData.split_type || "EQUAL",
      });
    }
  }, [initialData, fetchGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isEditing && initialData?.id) {
        // Edit Mode: Send only changed fields or necessary structure
        const payload: any = {};

        // Check for changes
        if (formData.description !== initialData.description)
          payload.description = formData.description;
        if (formData.amount !== initialData.amount)
          payload.amount = formData.amount;
        if (new Date(formData.date).toISOString() !== initialData.date)
          payload.date = new Date(formData.date).toISOString();
        if (formData.category !== initialData.category)
          payload.category = formData.category;
        if (formData.split_type !== initialData.split_type)
          payload.split_type = formData.split_type;

        // Note: Group ID cannot be changed in Edit mode per API rules, so we skip sending it.

        await updateExpense(initialData.id, payload);
        toast.success("Expense updated");
      } else {
        // Create Mode
        const payload: any = {
          description: formData.description,
          amount: formData.amount,
          category: formData.category,
          date: new Date(formData.date).toISOString(),
          split_type: formData.split_type,
          // Default: Current user pays full amount
          payers: [{ user_id: user.id, amount: formData.amount }],
          // Default: Split based on split_type (Simplified to EQUAL/Self for MVP)
          splits: [{ user_id: user.id, amount_owed: formData.amount }],
        };

        if (formData.group_id) {
          payload.group_id = formData.group_id;
        }

        await addExpense(payload);
        toast.success("Expense created");
      }
      router.push("/dashboard/expenses");
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine what to show for the "Group/Context" field
  const renderContextField = () => {
    if (isEditing) {
      // In Edit mode, Group/Friend is uneditable. Show a readonly input.
      let contextValue = "Personal Expense";
      if (initialData?.group) {
        contextValue = `Group: ${initialData.group.name}`;
      } else if (initialData?.friend_id) {
        // If friend name isn't directly in initialData root, we might need to find it in splits
        // For now, assuming friend_id implies a friend context
        contextValue = "Friend Expense";
      }

      return (
        <div>
          <label className="block text-sm font-medium text-mono-700 mb-1.5">
            Context (Uneditable)
          </label>
          <input
            disabled
            value={contextValue}
            className="w-full h-10 px-3 rounded-lg border border-mono-200 bg-mono-50 text-mono-500 cursor-not-allowed"
          />
        </div>
      );
    }

    // In Create mode, show Group Selector
    return (
      <div>
        <label className="block text-sm font-medium text-mono-700 mb-1.5">
          Group (Optional)
        </label>
        <select
          className="w-full h-10 px-3 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-200"
          value={formData.group_id}
          onChange={(e) =>
            setFormData({ ...formData, group_id: e.target.value })
          }
        >
          <option value="">Personal (No Group)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-mono-500 mt-1">
          *Select a group to split with members.
        </p>
      </div>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Description & Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Description"
            placeholder="e.g. Dinner at Taj"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>

        {/* Row 2: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-mono-700 mb-1.5">
              Category
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-200"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        {/* Row 3: Split Type & Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-mono-700 mb-1.5">
              Split Type
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-mono-300 bg-white text-mono-900 focus:outline-none focus:ring-2 focus:ring-mono-200"
              value={formData.split_type}
              onChange={(e) =>
                setFormData({ ...formData, split_type: e.target.value })
              }
            >
              {SPLIT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Context Field (Group/Friend) */}
          {renderContextField()}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-mono-100">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEditing ? "Save Changes" : "Create Expense"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
