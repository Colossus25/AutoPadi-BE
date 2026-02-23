import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { UserRequest } from '@/definitions';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly userSubscriptionService: UserSubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has active subscription
    const activeSubscriptions = await this.userSubscriptionService.getActiveSubscription(user);

    if (!activeSubscriptions) {
      throw new BadRequestException(
        'No active subscription found. Please purchase a subscription plan first.',
      );
    }

    // Validate subscription is still valid
    const isValid = this.userSubscriptionService.isSubscriptionValid(activeSubscriptions);

    if (!isValid) {
      throw new ForbiddenException('Your subscription has expired. Please renew to continue.');
    }

    // Attach subscription info to request for use in controller
    request.user_subscription = activeSubscriptions;

    return true;
  }
}
