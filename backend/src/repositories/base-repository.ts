/**
 * Base repository class providing common DynamoDB operations
 */

import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBEntity, QueryResult, PaginationParams } from '../types/dynamodb.types';

/**
 * Configuration options for BaseRepository
 */
export interface RepositoryConfig {
  tableName: string;
  region?: string;
  endpoint?: string;
}

/**
 * Base repository providing common DynamoDB operations
 */
export abstract class BaseRepository {
  protected readonly docClient: DynamoDBDocumentClient;
  protected readonly tableName: string;

  constructor(config: RepositoryConfig) {
    const clientConfig: DynamoDBClientConfig = {
      region: config.region || process.env.AWS_REGION || 'us-east-1',
    };

    // Allow local DynamoDB endpoint for testing
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    const client = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: false, // Changed: Set objects should be automatically converted to DynamoDB Sets
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    this.tableName = config.tableName;
  }

  /**
   * Get a single item by PK and SK
   */
  protected async getItem<T extends DynamoDBEntity>(pk: string, sk: string): Promise<T | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    });

    const response = await this.docClient.send(command);
    return (response.Item as T) || null;
  }

  /**
   * Put (create or replace) an item
   */
  protected async putItem<T extends DynamoDBEntity>(item: T): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.docClient.send(command);
  }

  /**
   * Update an item with conditional expression
   */
  protected async updateItem(
    pk: string,
    sk: string,
    updateExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, any>,
    conditionExpression?: string
  ): Promise<void> {
    // DynamoDB throws ValidationException if ExpressionAttributeNames is an empty object
    // Convert empty objects to undefined to avoid this error
    const sanitizedAttributeNames =
      Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: sanitizedAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: conditionExpression,
    });

    await this.docClient.send(command);
  }

  /**
   * Delete an item
   */
  protected async deleteItem(pk: string, sk: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    });

    await this.docClient.send(command);
  }

  /**
   * Query items with optional pagination
   */
  protected async query<T extends DynamoDBEntity>(
    queryInput: Partial<QueryCommandInput>,
    pagination?: PaginationParams
  ): Promise<QueryResult<T>> {
    const command = new QueryCommand({
      TableName: this.tableName,
      ...queryInput,
      Limit: pagination?.limit,
      ExclusiveStartKey: pagination?.lastEvaluatedKey,
    });

    const response = await this.docClient.send(command);

    return {
      items: (response.Items as T[]) || [],
      lastEvaluatedKey: response.LastEvaluatedKey,
      count: response.Count || 0,
    };
  }

  /**
   * Scan items with optional pagination and filter
   * WARNING: Use sparingly - Scan reads entire table. Only for admin operations with low frequency.
   * NOTE: With FilterExpression, Limit applies to items scanned, not items returned.
   * Use scanUntilLimit() if you need a specific number of matching items.
   */
  protected async scan<T extends DynamoDBEntity>(
    scanInput?: Partial<ScanCommandInput>,
    pagination?: PaginationParams
  ): Promise<QueryResult<T>> {
    const command = new ScanCommand({
      TableName: this.tableName,
      ...scanInput,
      Limit: pagination?.limit,
      ExclusiveStartKey: pagination?.lastEvaluatedKey,
    });

    const response = await this.docClient.send(command);

    return {
      items: (response.Items as T[]) || [],
      lastEvaluatedKey: response.LastEvaluatedKey,
      count: response.Count || 0,
    };
  }

  /**
   * Scan items with filter, accumulating results until the desired limit is reached.
   * Unlike regular scan where Limit applies to items scanned (not returned),
   * this method keeps scanning until it has `limit` matching items or exhausts the table.
   * WARNING: Use sparingly - can result in multiple scan operations.
   */
  protected async scanUntilLimit<T extends DynamoDBEntity>(
    scanInput?: Partial<ScanCommandInput>,
    pagination?: PaginationParams
  ): Promise<QueryResult<T>> {
    const limit = pagination?.limit || 20;
    const accumulatedItems: T[] = [];
    let lastEvaluatedKey = pagination?.lastEvaluatedKey;
    let hasMore = true;

    // Keep scanning until we have enough items or no more data
    while (accumulatedItems.length < limit && hasMore) {
      const command = new ScanCommand({
        TableName: this.tableName,
        ...scanInput,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await this.docClient.send(command);
      const items = (response.Items as T[]) || [];

      // Add items to our accumulated list (up to the limit)
      const remainingSlots = limit - accumulatedItems.length;
      accumulatedItems.push(...items.slice(0, remainingSlots));

      // Update pagination state
      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      // If we got more items than we needed, we still have more to fetch
      if (items.length > remainingSlots) {
        hasMore = true;
      }
    }

    return {
      items: accumulatedItems,
      lastEvaluatedKey: hasMore ? lastEvaluatedKey : undefined,
      count: accumulatedItems.length,
    };
  }

  /**
   * Batch get multiple items
   */
  protected async batchGetItems<T extends DynamoDBEntity>(
    keys: Array<{ PK: string; SK: string }>
  ): Promise<T[]> {
    if (keys.length === 0) {
      return [];
    }

    const command = new BatchGetCommand({
      RequestItems: {
        [this.tableName]: {
          Keys: keys,
        },
      },
    });

    const response = await this.docClient.send(command);
    return (response.Responses?.[this.tableName] as T[]) || [];
  }

  /**
   * Batch write (put or delete) items
   * Max 25 items per batch
   */
  protected async batchWriteItems(
    putItems: DynamoDBEntity[] = [],
    deleteKeys: Array<{ PK: string; SK: string }> = []
  ): Promise<void> {
    if (putItems.length === 0 && deleteKeys.length === 0) {
      return;
    }

    const writeRequests = [
      ...putItems.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
      ...deleteKeys.map((key) => ({
        DeleteRequest: {
          Key: key,
        },
      })),
    ];

    const command = new BatchWriteCommand({
      RequestItems: {
        [this.tableName]: writeRequests,
      },
    });

    await this.docClient.send(command);
  }
}
