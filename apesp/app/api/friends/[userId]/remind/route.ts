import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import {
  successResponse,
  errorResponse,
  notFound,
  badRequest,
} from "@/src/lib/response";
import { sendEmail } from "@/src/services/messageServices";
import { NotificationType } from "@prisma/client";

// Validation Schema
const remindSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  message: z.string().max(500, "Message too long").optional(),
});

/**
 * POST /friends/{friendId}/remind
 * Sends a payment reminder with amount and custom message.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { userId: string } }
) => {
  try {
    const { userId } = payload;
    const { userId: friendId } = context.params;

    const body = await request.json();
    const { amount, message } = remindSchema.parse(body);

    // Validate Friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requester_id: userId, addressee_id: friendId },
          { requester_id: friendId, addressee_id: userId },
        ],
        status: "ACCEPTED",
      },
      include: {
        requester: true,
        addressee: true,
      },
    });

    if (!friendship) {
      return notFound("Friendship not found");
    }

    const friend =
      friendship.requester_id === friendId
        ? friendship.requester
        : friendship.addressee;

    const sender =
      friendship.requester_id === userId
        ? friendship.requester
        : friendship.addressee;

    if (!friend || !friend.email) {
      return badRequest("Friend does not have a valid email");
    }
    sendEmail({
        to: friend.email,
      // to: "anujhatiya900@gmail.com",
      templateId: 6,
      data: {
        friendName: sender.name.trim().split(" ")[0],
        recipientName: friend.name.trim().split(" ")[0],
        amount: amount,
        customMessage: message || "Please settle up when you get a chance.",
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/friends/${userId}`,
      },
      subject: `Reminder: You owe ${sender.name} ${amount}`,
      notificationData: {
        recipientId: friendId,
        type: "REMINDER" as NotificationType,
        title: "Mere pAIse?!",
        message: message || `You owe ${amount} to ${sender.name}!`,
      },
    });

    return successResponse("Reminder sent successfully");
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    if (error instanceof z.ZodError)
      return badRequest("Invalid input", error.issues);
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
