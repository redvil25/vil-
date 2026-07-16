# Extending the Sandbox

This guide walks you through adding new features to your sandbox. Each section
covers one layer of the stack -- from the database up through the API to the
frontend -- with pointers to the existing code you should use as a reference.

---

## 1. Adding a New DynamoDB Entity

The sandbox uses a **single-table design**. Every item shares the same table and
is distinguished by its `PK` (partition key) and `SK` (sort key).

### 1a. Define the entity type

Open `backend/src/types/dynamodb.types.ts` and add an interface below the
`// Add your own entity types below` comment:

```ts
/**
 * Post entity
 * PK: POST#{postId}
 * SK: METADATA
 */
export interface PostEntity extends DynamoDBEntity {
  PK: `POST#${string}`;
  SK: 'METADATA';
  EntityType: 'Post';
  PostId: string;
  AuthorId: string;
  Title: string;
  Body: string;
  CreatedAt: string;
  UpdatedAt: string;
}
```

### 1b. Add key generators

Open `backend/src/utils/dynamodb-keys.ts` and add helpers below the
`// Add your own entity key generators below` comment:

```ts
export const postPK = (postId: string): `POST#${string}` => `POST#${postId}`;
```

You can reuse the existing `metadataSK()` helper since your SK is `METADATA`.

### 1c. Create a repository

Create `backend/src/repositories/post-repository.ts`. Extend `BaseRepository`
the same way `user-repository.ts` does:

```ts
import { BaseRepository, RepositoryConfig } from './base-repository';
import { PostEntity } from '../types/dynamodb.types';
import { postPK, metadataSK, getCurrentTimestamp } from '../utils/dynamodb-keys';
import { v4 as uuidv4 } from 'uuid';

export class PostRepository extends BaseRepository {
  constructor(config?: Partial<RepositoryConfig>) {
    super({
      tableName: config?.tableName || process.env.DYNAMODB_TABLE_NAME || 'sandbox-table',
      region: config?.region,
      endpoint: config?.endpoint,
    });
  }

  async createPost(authorId: string, title: string, body: string): Promise<PostEntity> {
    const postId = uuidv4();
    const now = getCurrentTimestamp();
    const post: PostEntity = {
      PK: postPK(postId),
      SK: metadataSK(),
      EntityType: 'Post',
      PostId: postId,
      AuthorId: authorId,
      Title: title,
      Body: body,
      CreatedAt: now,
      UpdatedAt: now,
    };
    await this.putItem(post);
    return post;
  }

  async getPostById(postId: string): Promise<PostEntity | null> {
    return this.getItem<PostEntity>(postPK(postId), metadataSK());
  }
}
```

`BaseRepository` gives you `getItem`, `putItem`, `updateItem`, `deleteItem`,
`query`, `scan`, `batchGetItems`, and `batchWriteItems` out of the box.

### 1d. Add GSIs (if needed)

If you need to query posts by author, add a GSI in
`infrastructure/modules/dynamodb/main.tf` below the
`# Add your own GSIs below` comment:

```hcl
  attribute {
    name = "AuthorId"
    type = "S"
  }

  global_secondary_index {
    name            = "AuthorIdIndex"
    hash_key        = "AuthorId"
    range_key       = "CreatedAtTimestamp"
    projection_type = "ALL"
  }
```

Remember to also declare any new `attribute` blocks at the top of the table
resource -- DynamoDB requires every key attribute to be listed there.

---

## 2. Adding a New Service

Services live in `backend/src/services/` and contain business logic. They call
repositories for data access and never interact with DynamoDB directly.

Create `backend/src/services/post-service.ts`:

```ts
import { PostRepository } from '../repositories/post-repository';
import { PostEntity } from '../types/dynamodb.types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class PostService {
  private readonly postRepository: PostRepository;

  constructor(postRepository?: PostRepository) {
    this.postRepository = postRepository || new PostRepository();
  }

  async createPost(authorId: string, title: string, body: string): Promise<PostEntity> {
    if (!title || title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }
    return this.postRepository.createPost(authorId, title, body);
  }

  async getPost(postId: string): Promise<PostEntity> {
    const post = await this.postRepository.getPostById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    return post;
  }
}
```

Follow the same conventions you see in `user-service.ts`:
- Accept repository instances via the constructor for testability.
- Throw typed errors (`ValidationError`, `NotFoundError`, `ForbiddenError`)
  from `backend/src/utils/errors.ts`.
- Keep HTTP/Lambda concerns out of the service layer.

---

## 3. Adding a New API Handler

Handlers live in `backend/src/handlers/`. Each handler is a Lambda function that
receives an `APIGatewayProxyEvent` and returns an `APIGatewayProxyResult`.

### 3a. Create the handler

Create `backend/src/handlers/post-handler.ts`. Use `profile-handler.ts` as your
template:

```ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PostService } from '../services/post-service';
import {
  successResponse,
  errorResponse,
  parseRequestBody,
  getRequestId,
  corsPreflightResponse,
} from '../utils/api-response';
import { HttpStatus } from '../types/api.types';
import { getUserContext } from '../utils/auth-context';

const postService = new PostService();

export const createPostHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);
  try {
    if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

    const { userId } = await getUserContext(event);
    const body = parseRequestBody(event.body);
    const post = await postService.createPost(userId, body.title, body.body);

    return successResponse(post, HttpStatus.CREATED, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  if (method === 'POST') return createPostHandler(event, context);
  if (method === 'OPTIONS') return corsPreflightResponse();
  return errorResponse(new Error('Route not found'), getRequestId(event));
};
```

### 3b. Register the handler locally

In `backend/src/server.ts`, import your handler and add a route:

```ts
import { handler as postHandler } from './handlers/post-handler';

// Post routes
app.all('/posts/*', wrapHandler(postHandler, '/posts'));
app.all('/posts', wrapHandler(postHandler, ''));
```

### 3c. Add request validators

Create `backend/src/validators/post.validators.ts` using Zod, following the
pattern in `profile.validators.ts`:

```ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});
```

Then call `validateRequest(createPostSchema, body)` inside your handler before
passing data to the service.

---

## 4. Adding a New Frontend Page

The frontend uses the Next.js App Router. Creating a file at
`frontend/src/app/<path>/page.tsx` automatically creates a route at `/<path>`.

### 4a. Create the page component

Create `frontend/src/app/posts/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { postsAPI } from '@/lib/api/endpoints/posts';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    postsAPI.listPosts().then(setPosts).catch(console.error);
  }, []);

  return (
    <main>
      <h1>Posts</h1>
      {posts.map((post: { PostId: string; Title: string }) => (
        <div key={post.PostId}>{post.Title}</div>
      ))}
    </main>
  );
}
```

### 4b. Add the API client endpoint

Create `frontend/src/lib/api/endpoints/posts.ts`, following the pattern in
`profile.ts`:

```ts
import apiClient from '../client';
import type { APIResponse } from '@/types/api.types';

export interface Post {
  postId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}

export const postsAPI = {
  listPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get<APIResponse<Post[]>>('/posts');
    return response.data.data;
  },

  createPost: async (title: string, body: string): Promise<Post> => {
    const response = await apiClient.post<APIResponse<Post>>('/posts', { title, body });
    return response.data.data;
  },
};
```

The shared `apiClient` in `frontend/src/lib/api/client.ts` automatically
attaches the auth token and handles 401 token refresh, so you do not need to
worry about authentication headers.

### 4c. Add TypeScript types

If your feature introduces types used across multiple components, add them to
`frontend/src/types/api.types.ts`:

```ts
export interface Post {
  postId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}
```

---

## 5. Adding Infrastructure for New Features

### 5a. Add a Lambda function

In `infrastructure/modules/lambda/main.tf`, add a new function block following
the existing pattern (see the `auth` or `profile` Lambda as examples):

```hcl
data "archive_file" "posts" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/bundles/post-handler"
  output_path = "${path.module}/../../../backend/dist/bundles/posts.zip"
}

resource "aws_lambda_function" "posts" {
  filename         = data.archive_file.posts.output_path
  function_name    = "${var.project_name}-posts-${var.environment}"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.posts.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory
  timeout          = var.lambda_timeout

  environment {
    variables = local.common_environment_variables
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-posts-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "posts" {
  name              = "/aws/lambda/${aws_lambda_function.posts.function_name}"
  retention_in_days = var.environment == "prod" ? 90 : 30
}
```

### 5b. Add API Gateway routes

Create a new file `infrastructure/modules/api-routes/posts-routes.tf` or add to
`main.tf`. You need a resource, a method, an integration, and a Lambda
permission:

```hcl
resource "aws_api_gateway_resource" "posts" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = "posts"
}

resource "aws_api_gateway_method" "posts_post" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.posts.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}

resource "aws_api_gateway_integration" "posts_post" {
  rest_api_id             = var.api_gateway_id
  resource_id             = aws_api_gateway_resource.posts.id
  http_method             = aws_api_gateway_method.posts_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.posts_lambda_invoke_arn
}
```

### 5c. Add GSIs

See section 1d above. Add new GSIs in
`infrastructure/modules/dynamodb/main.tf` below the
`# Add your own GSIs below` comment.

---

## 6. Worked Example: Adding a "Todo" Feature

Here is the sequence of files you would create or edit to add a simple Todo
feature with create and list operations.

### Files to create

| Layer          | File                                                |
|----------------|-----------------------------------------------------|
| Types          | `backend/src/types/dynamodb.types.ts` (edit)        |
| Keys           | `backend/src/utils/dynamodb-keys.ts` (edit)         |
| Repository     | `backend/src/repositories/todo-repository.ts`       |
| Service        | `backend/src/services/todo-service.ts`              |
| Handler        | `backend/src/handlers/todo-handler.ts`              |
| Validators     | `backend/src/validators/todo.validators.ts`         |
| Local server   | `backend/src/server.ts` (edit)                      |
| Frontend API   | `frontend/src/lib/api/endpoints/todos.ts`           |
| Frontend types | `frontend/src/types/api.types.ts` (edit)            |
| Frontend page  | `frontend/src/app/todos/page.tsx`                   |
| Lambda         | `infrastructure/modules/lambda/main.tf` (edit)      |
| API routes     | `infrastructure/modules/api-routes/main.tf` (edit)  |

### Key snippets

**dynamodb.types.ts** -- add the entity:

```ts
export interface TodoEntity extends DynamoDBEntity {
  PK: `USER#${string}`;
  SK: `TODO#${string}`;
  EntityType: 'Todo';
  TodoId: string;
  UserId: string;
  Title: string;
  Completed: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}
```

**dynamodb-keys.ts** -- add the key generator:

```ts
export const todoPK = (userId: string): `USER#${string}` => `USER#${userId}`;
export const todoSK = (todoId: string): `TODO#${string}` => `TODO#${todoId}`;
```

Note that the Todo PK is `USER#{userId}`, which lets you query all todos for a
user with a single `query` call using `begins_with(SK, 'TODO#')`.

**server.ts** -- register the route:

```ts
import { handler as todoHandler } from './handlers/todo-handler';

app.all('/todos/*', wrapHandler(todoHandler, '/todos'));
app.all('/todos', wrapHandler(todoHandler, ''));
```

**frontend/src/lib/api/endpoints/todos.ts** -- API client:

```ts
import apiClient from '../client';
import type { APIResponse } from '@/types/api.types';

export interface Todo {
  todoId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export const todosAPI = {
  list: async (): Promise<Todo[]> => {
    const response = await apiClient.get<APIResponse<Todo[]>>('/todos');
    return response.data.data;
  },

  create: async (title: string): Promise<Todo> => {
    const response = await apiClient.post<APIResponse<Todo>>('/todos', { title });
    return response.data.data;
  },
};
```

### Testing locally

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000/todos` in your browser.

The local Express server in `server.ts` wraps your Lambda handlers so you can
develop without deploying to AWS.

---

## Quick Reference: Where Things Live

| Concern               | Path                                              |
|-----------------------|---------------------------------------------------|
| DynamoDB entity types | `backend/src/types/dynamodb.types.ts`             |
| Key generators        | `backend/src/utils/dynamodb-keys.ts`              |
| Repositories          | `backend/src/repositories/`                       |
| Services              | `backend/src/services/`                           |
| Lambda handlers       | `backend/src/handlers/`                           |
| Request validators    | `backend/src/validators/`                         |
| Local dev server      | `backend/src/server.ts`                           |
| Error utilities       | `backend/src/utils/errors.ts`                     |
| Response helpers      | `backend/src/utils/api-response.ts`               |
| Auth context          | `backend/src/utils/auth-context.ts`               |
| Frontend API client   | `frontend/src/lib/api/client.ts`                  |
| Frontend API endpoints| `frontend/src/lib/api/endpoints/`                 |
| Frontend types        | `frontend/src/types/api.types.ts`                 |
| Frontend pages        | `frontend/src/app/`                               |
| Lambda config (IaC)   | `infrastructure/modules/lambda/main.tf`           |
| API routes (IaC)      | `infrastructure/modules/api-routes/`              |
| DynamoDB table (IaC)  | `infrastructure/modules/dynamodb/main.tf`         |
