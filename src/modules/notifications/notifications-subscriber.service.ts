import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  AccountEvent,
  BookingCancelledEvent,
  BookingCreatedEvent,
  BookingReviewedEvent,
  BookingStatusChangedEvent,
  MessageSentEvent,
  NotificationEvent,
  PaymentEvent,
  ServiceModerationEvent,
  SubscriptionEvent,
} from "./notification-events";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

/**
 * Listens for domain events and turns them into notifications.
 * All notification copy lives here so domain modules stay decoupled.
 */
@Injectable()
export class NotificationsSubscriberService {
  private readonly logger = new Logger(NotificationsSubscriberService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway
  ) {}

  // ----- Booking -----------------------------------------------------------

  @OnEvent(NotificationEvent.BOOKING_CREATED)
  async onBookingCreated(e: BookingCreatedEvent) {
    await this.notifications.notify({
      userId: e.providerId,
      tag: "booking",
      title: "New booking request",
      body: e.serviceName
        ? `You have a new booking request for ${e.serviceName}.`
        : "You have a new booking request.",
      data: { type: "booking", bookingId: String(e.bookingId) },
    });
  }

  @OnEvent(NotificationEvent.BOOKING_STATUS_CHANGED)
  async onBookingStatusChanged(e: BookingStatusChangedEvent) {
    await this.notifications.notify({
      userId: e.customerId,
      tag: "booking",
      title: "Booking update",
      body: `Your booking${e.serviceName ? ` for ${e.serviceName}` : ""} is now ${e.status}.`,
      data: { type: "booking", bookingId: String(e.bookingId), status: e.status },
    });
  }

  @OnEvent(NotificationEvent.BOOKING_CANCELLED)
  async onBookingCancelled(e: BookingCancelledEvent) {
    await this.notifications.notify({
      userId: e.providerId,
      tag: "booking",
      title: "Booking cancelled",
      body: `A booking${e.serviceName ? ` for ${e.serviceName}` : ""} was cancelled${e.reason ? `: ${e.reason}` : "."}`,
      data: { type: "booking", bookingId: String(e.bookingId) },
    });
  }

  @OnEvent(NotificationEvent.BOOKING_REVIEWED)
  async onBookingReviewed(e: BookingReviewedEvent) {
    await this.notifications.notify({
      userId: e.providerId,
      tag: "booking",
      title: "New review",
      body: `You received a ${e.rating}-star review.`,
      data: { type: "booking", bookingId: String(e.bookingId) },
    });
  }

  // ----- Messaging ---------------------------------------------------------

  @OnEvent(NotificationEvent.MESSAGE_SENT)
  async onMessageSent(e: MessageSentEvent) {
    // Chat messages don't create an in-app feed entry (the conversation is the
    // record). Push only to recipients who are NOT currently connected — those
    // who are online already receive the message live over the messaging socket.
    const title = e.senderName ? `New message from ${e.senderName}` : "New message";
    const body = e.preview?.trim() ? e.preview : "You have a new message.";

    for (const recipientId of e.recipientIds) {
      if (recipientId === e.senderId) continue;
      if (await this.gateway.isUserOnline(recipientId)) continue;

      await this.notifications.pushToUser(recipientId, {
        title,
        body,
        data: { type: "message", conversationId: e.conversationId },
      });
    }
  }

  // ----- Subscriptions -----------------------------------------------------

  @OnEvent(NotificationEvent.SUBSCRIPTION_ACTIVATED)
  async onSubscriptionActivated(e: SubscriptionEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "subscription",
      title: "Subscription activated",
      body: `${e.planName || "Your plan"} is now active.`,
      data: { type: "subscription" },
    });
  }

  @OnEvent(NotificationEvent.SUBSCRIPTION_EXPIRING_SOON)
  async onSubscriptionExpiringSoon(e: SubscriptionEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "subscription",
      title: "Subscription expiring soon",
      body: `${e.planName || "Your plan"} expires${e.daysLeft != null ? ` in ${e.daysLeft} day(s)` : " soon"}. Renew to avoid interruption.`,
      data: { type: "subscription" },
    });
  }

  @OnEvent(NotificationEvent.SUBSCRIPTION_EXPIRED)
  async onSubscriptionExpired(e: SubscriptionEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "subscription",
      title: "Subscription expired",
      body: `${e.planName || "Your plan"} has expired.`,
      data: { type: "subscription" },
    });
  }

  @OnEvent(NotificationEvent.SUBSCRIPTION_RENEWED)
  async onSubscriptionRenewed(e: SubscriptionEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "subscription",
      title: "Subscription renewed",
      body: `${e.planName || "Your plan"} was renewed successfully.`,
      data: { type: "subscription" },
    });
  }

  @OnEvent(NotificationEvent.SUBSCRIPTION_RENEWAL_FAILED)
  async onSubscriptionRenewalFailed(e: SubscriptionEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "subscription",
      title: "Subscription renewal failed",
      body: `We couldn't renew ${e.planName || "your plan"}${e.reason ? `: ${e.reason}` : "."}`,
      data: { type: "subscription" },
    });
  }

  @OnEvent(NotificationEvent.PAYMENT_SUCCESSFUL)
  async onPaymentSuccessful(e: PaymentEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "payment",
      title: "Payment successful",
      body: `Your payment${e.amount ? ` of ₦${e.amount}` : ""} was received.`,
      data: { type: "payment", ...(e.reference ? { reference: e.reference } : {}) },
    });
  }

  @OnEvent(NotificationEvent.PAYMENT_FAILED)
  async onPaymentFailed(e: PaymentEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "payment",
      title: "Payment failed",
      body: `Your payment${e.amount ? ` of ₦${e.amount}` : ""} failed${e.reason ? `: ${e.reason}` : "."}`,
      data: { type: "payment", ...(e.reference ? { reference: e.reference } : {}) },
    });
  }

  // ----- Service moderation -----------------------------------------------

  @OnEvent(NotificationEvent.SERVICE_APPROVED)
  async onServiceApproved(e: ServiceModerationEvent) {
    await this.notifications.notify({
      userId: e.providerId,
      tag: "service",
      title: "Service approved",
      body: `${e.serviceName || "Your service"} has been approved and is now live.`,
      data: { type: "service", serviceId: String(e.serviceId) },
    });
  }

  @OnEvent(NotificationEvent.SERVICE_REJECTED)
  async onServiceRejected(e: ServiceModerationEvent) {
    await this.notifications.notify({
      userId: e.providerId,
      tag: "service",
      title: "Service rejected",
      body: `${e.serviceName || "Your service"} was rejected${e.reason ? `: ${e.reason}` : "."}`,
      data: { type: "service", serviceId: String(e.serviceId) },
    });
  }

  // ----- Account security --------------------------------------------------

  @OnEvent(NotificationEvent.EMAIL_VERIFIED)
  async onEmailVerified(e: AccountEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "account",
      title: "Email verified",
      body: "Your email address has been verified.",
      data: { type: "account" },
    });
  }

  @OnEvent(NotificationEvent.PASSWORD_CHANGED)
  async onPasswordChanged(e: AccountEvent) {
    await this.notifications.notify({
      userId: e.userId,
      tag: "account",
      title: "Password changed",
      body: "Your password was changed. If this wasn't you, contact support immediately.",
      data: { type: "account" },
    });
  }
}
