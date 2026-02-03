import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

let cachedClient;

export const getR2Client = () => {
  if (cachedClient) return cachedClient;

  const endpoint = requiredEnv("R2_ENDPOINT");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");

  cachedClient = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  return cachedClient;
};

export const getR2Bucket = () => requiredEnv("R2_Bucket");

export const r2PutObject = async ({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=3600",
}) => {
  const client = getR2Client();
  const Bucket = getR2Bucket();

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );

  return { bucket: Bucket, key };
};

const listAllKeysWithPrefix = async (prefix) => {
  const client = getR2Client();
  const Bucket = getR2Bucket();

  const keys = [];
  let ContinuationToken;

  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix,
        ContinuationToken,
      }),
    );

    for (const obj of result.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }

    ContinuationToken = result.IsTruncated
      ? result.NextContinuationToken
      : undefined;
  } while (ContinuationToken);

  return keys;
};

export const r2DeleteKeys = async (keys) => {
  if (!keys || keys.length === 0) return;

  const client = getR2Client();
  const Bucket = getR2Bucket();

  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }
};

export const r2DeleteObject = async (key) => {
  if (!key) return;

  const client = getR2Client();
  const Bucket = getR2Bucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket,
      Key: key,
    }),
  );
};

export const r2DeleteByPrefix = async (prefix, { keepKeys = [] } = {}) => {
  const allKeys = await listAllKeysWithPrefix(prefix);
  const keep = new Set(keepKeys);
  const toDelete = allKeys.filter((k) => !keep.has(k));
  await r2DeleteKeys(toDelete);
  return { deletedCount: toDelete.length };
};

export const r2GetSignedReadUrl = async ({ key, expiresInSeconds = 300 }) => {
  const client = getR2Client();
  const Bucket = getR2Bucket();

  const command = new GetObjectCommand({
    Bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return { url, expiresInSeconds };
};
