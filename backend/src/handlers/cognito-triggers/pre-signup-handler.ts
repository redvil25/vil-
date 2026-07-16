/**
 * Cognito Pre Sign-up Trigger Handler
 *
 * This function handles Pre Sign-up events from Cognito User Pool.
 * For external identity providers (Google), it:
 * - Auto-confirms the user (bypasses email verification)
 * - Auto-verifies the email address
 * - Creates a DynamoDB user profile with Reader role
 */

import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client outside handler for connection reuse
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || '';

export const handler: PreSignUpTriggerHandler = async (
  event: PreSignUpTriggerEvent
): Promise<PreSignUpTriggerEvent> => {
  console.info('Pre Sign-up trigger invoked:', {
    triggerSource: event.triggerSource,
    userName: event.userName,
    userPoolId: event.userPoolId,
  });

  // Check if this is an external provider (Google, Facebook, etc.)
  const isExternalProvider = event.triggerSource === 'PreSignUp_ExternalProvider';

  if (isExternalProvider) {
    console.info('Processing external provider sign-up');

    // Auto-confirm and auto-verify email for federated users
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    // Extract user info from Cognito attributes
    const email = event.request.userAttributes.email?.toLowerCase();
    const name = event.request.userAttributes.name || '';
    const cognitoSub = event.userName; // For external providers, this is provider-specific identifier

    if (!email) {
      console.error('Email is required for external provider sign-up');
      throw new Error('Email is required for external provider sign-up');
    }

    console.info('Checking for existing user with email:', email);

    // Check if user already exists by email (may have registered with email/password before)
    const existingUser = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'Email = :email',
        ExpressionAttributeValues: { ':email': email },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      // User exists - allow sign-in but don't create duplicate profile
      // Cognito will link the accounts automatically
      console.info('User already exists with email, allowing sign-in:', email);
      return event;
    }

    // Create new user profile in DynamoDB
    const userId = uuidv4();
    const now = new Date().toISOString();
    const username = generateUsername(name, email);

    const userProfile = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      EntityType: 'UserProfile',
      UserId: userId,
      Email: email,
      Username: username,
      Role: 'Reader', // Default role for social sign-ups
      CognitoSub: cognitoSub,
      CreatedAt: now,
      UpdatedAt: now,
    };

    console.info('Creating user profile for federated user:', {
      userId,
      email,
      username,
      cognitoSub,
    });

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: userProfile,
          ConditionExpression: 'attribute_not_exists(PK)',
        })
      );

      console.info('Successfully created user profile:', userId);
    } catch (error) {
      // If the condition fails, user was created by a race condition - that's OK
      if ((error as Error).name === 'ConditionalCheckFailedException') {
        console.warn('User profile already exists (race condition), continuing:', userId);
      } else {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }
  } else {
    // Standard Cognito sign-up (email/password) - no auto-confirmation
    console.info('Standard Cognito sign-up, no auto-confirmation');
  }

  return event;
};

/**
 * Generate a username from the user's name or email
 * @param name - User's full name from identity provider
 * @param email - User's email address
 * @returns A sanitized username
 */
function generateUsername(name: string, email: string): string {
  // Try to create username from name first
  if (name && name.trim()) {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    if (sanitized.length >= 3) {
      return sanitized;
    }
  }

  // Fall back to email prefix
  const emailPrefix = email.split('@')[0];
  return emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}
