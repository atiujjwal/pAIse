import { v4 as uuidv4 } from "uuid";
import amqp, { Channel, Connection, ConsumeMessage } from "amqplib";

type Job<T = any> = {
  id: string;
  data: T;
};

type ProcessCallback = (job: Job) => Promise<void>;

/**
 * A RabbitMQ-based Job Queue service.
 * * Prerequisites:
 * 1. Install amqplib: `npm install amqplib`
 * 2. Install types: `npm install --save-dev @types/amqplib`
 * 3. Ensure a RabbitMQ instance is running (local or cloud).
 */
class JobQueue {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private rabbitUrl: string = process.env.RABBITMQ_URL || "amqp://localhost";

  /**
   * Establishes or returns an existing connection to RabbitMQ.
   */
  private async getChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    try {
      console.log(`[JobQueue] Connecting to RabbitMQ at ${this.rabbitUrl}...`);
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Handle connection errors/closure
      this.connection.on("close", () => {
        console.error(
          "[JobQueue] RabbitMQ connection closed. Resetting state."
        );
        this.channel = null;
        this.connection = null;
      });

      this.connection.on("error", (err) => {
        console.error("[JobQueue] RabbitMQ connection error:", err);
      });

      console.log("[JobQueue] Connected to RabbitMQ successfully.");
      return this.channel;
    } catch (error) {
      console.error("[JobQueue] Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  /**
   * Registers a worker/consumer for a specific job name (Queue).
   */
  async process(jobName: string, callback: ProcessCallback): Promise<void> {
    const channel = await this.getChannel();

    // Assert queue ensures it exists. Durable=true means queue survives broker restart
    await channel.assertQueue(jobName, { durable: true });

    // Prefetch 1 ensures we only process one job at a time per worker instance
    // This prevents one worker from hogging all tasks if they are heavy.
    await channel.prefetch(1);

    console.log(`[JobQueue] Worker registered for queue: ${jobName}`);

    channel.consume(jobName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      const content = msg.content.toString();
      let job: Job;

      try {
        job = JSON.parse(content);
      } catch (e) {
        console.error(
          `[JobQueue] Failed to parse job from ${jobName}:`,
          content
        );
        // If JSON is invalid, we can't process it.
        // nack(msg, false, false) -> false (allUpTo), false (requeue) = Discard message
        channel.nack(msg, false, false);
        return;
      }

      try {
        console.log(`[JobQueue] Processing job: ${jobName} (ID: ${job.id})...`);
        await callback(job);
        console.log(`[JobQueue] Job completed: ${jobName} (ID: ${job.id})`);

        // Acknowledge success - removes message from queue
        channel.ack(msg);
      } catch (error) {
        console.error(
          `[JobQueue] Job FAILED: ${jobName} (ID: ${job.id})`,
          error
        );

        // Negative Acknowledge on failure.
        // requeue: false -> sends to Dead Letter Exchange if configured, or discards.
        // requeue: true -> puts it back at head of queue.
        // CAUTION: Requeueing true without delay can cause infinite loops if the error is permanent.
        // For safety here, we do not requeue immediately.
        channel.nack(msg, false, false);
      }
    });
  }

  /**
   * Adds a job to the queue.
   * Returns immediately with a Job ID.
   */
  async add(jobName: string, data: any): Promise<{ id: string }> {
    const channel = await this.getChannel();

    // Ensure queue exists before sending
    await channel.assertQueue(jobName, { durable: true });

    const jobId = uuidv4();
    const job: Job = { id: jobId, data };

    // Persistent: true means message is saved to disk on RabbitMQ
    const sent = channel.sendToQueue(
      jobName,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );

    if (sent) {
      console.log(`[JobQueue] Enqueued job: ${jobName} (ID: ${jobId})`);
    } else {
      console.warn(
        `[JobQueue] Failed to enqueue job: ${jobName} (ID: ${jobId}) - Buffer full?`
      );
    }

    return { id: jobId };
  }
}

export const jobQueue = new JobQueue();
