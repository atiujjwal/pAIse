"use client";
import { useParams } from "next/navigation";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-mono-900">Group Details</h1>
        <p className="text-mono-500">Displaying details for group: {groupId}</p>
      </div>
      {/* You can fetch and display group-specific data here */}
    </div>
  );
}