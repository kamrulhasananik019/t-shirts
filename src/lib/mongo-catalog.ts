import { ObjectId } from 'mongodb';
import { unstable_cache } from 'next/cache';

import { CATALOG_TAGGED_DATA_REVALIDATE } from '@/lib/catalog-cache-policy';
import { toSlug } from '@/lib/slug';
import { getMongoDb } from '@/lib/mongodb';
import type { RichDescription, TipTapDoc } from '@/types/rich-content';

type RichTextDoc = {
  type: 'doc';
  content: Array<Record<string, unknown>>;
};

type SeoBlock = {
  title: string;
  description: string;
  keywords: string[];
  image: string;
};

type SeoInput = {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
};

type ImageBlock = {
  url: string;
  alt: string;
};

type CategoryDoc = {
  _id: ObjectId;
  slug: string;
  slugAliases: string[];
  name: string;
  shortDescription?: RichTextDoc | RichDescription;
  description: RichTextDoc | RichDescription;
  image: ImageBlock;
  parentId: ObjectId | null;
  seo: SeoBlock;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProductDoc = {
  _id: ObjectId;
  slug: string;
  slugAliases: string[];
  name: string;
  shortDescription: RichTextDoc | RichDescription;
  description: RichTextDoc | RichDescription;
  images: ImageBlock[];
  badges: string[];
  categoryIds: ObjectId[];
  seo: SeoBlock;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type AdminDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewStatus = 'pending' | 'approved' | 'declined' | 'deleted';

type ReviewDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  source: 'public' | 'admin';
  createdAt: Date;
  updatedAt: Date;
};

type FaqDoc = {
  _id: ObjectId;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  // Cache index creation so repeated reads do not re-run createIndexes on every request.
  var __primeprintsIndexesPromise: Promise<void> | undefined;
}

export type CategoryRecord = {
  id: string;
  slug: string;
  slugAliases: string[];
  name: string;
  shortDescription?: RichDescription;
  description: RichDescription;
  image: ImageBlock;
  imageUrl: string;
  parentId: string | null;
  seo: SeoBlock;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductRecord = {
  id: string;
  slug: string;
  slugAliases: string[];
  name: string;
  shortDescription: RichDescription;
  description: RichDescription;
  images: ImageBlock[];
  categoryIds: string[];
  seo: SeoBlock;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Backward-compatible aliases for existing UI paths.
  imageUrl: string[];
  badges: string[];
  categoryId: string[];
};

export type AdminCategoryRow = {
  id: string;
  name: string;
  short_description: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image: string;
  created_at: string;
};

export type AdminProductRow = {
  id: string;
  name: string;
  image_url: string;
  description: string;
  short_description: string;
  badges: string;
  category_id: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image: string;
  created_at: string;
};

export type ReviewRecord = {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  source: 'public' | 'admin';
  createdAt: string;
  updatedAt: string;
};

export type AdminReviewRow = {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  source: 'public' | 'admin';
  created_at: string;
};

export type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminFaqRow = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function defaultRichText(text = ''): TipTapDoc {
  return {
    type: 'doc',
    content: text
      ? [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ]
      : [],
  };
}

function isTipTapDoc(value: unknown): value is TipTapDoc {
  return Boolean(value && typeof value === 'object' && (value as { type?: string }).type === 'doc');
}

function parseRichValue(value: string | null | undefined): RichDescription {
  if (!value) return defaultRichText();
  try {
    const parsed = JSON.parse(value) as unknown;
    if (isTipTapDoc(parsed)) return parsed;
    return defaultRichText(value);
  } catch {
    return defaultRichText(value);
  }
}

function normalizeRichContent(value: unknown): RichDescription {
  if (!value) return defaultRichText();
  if (typeof value === 'string') return parseRichValue(value);
  if (isTipTapDoc(value)) return value;
  return defaultRichText();
}

function toStoredRich(value: string): TipTapDoc {
  return normalizeRichContent(value);
}

function normalizeSlugAliases(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map((value) => toSlug(String(value || ''))).filter(Boolean)));
}

function serializeRichForAdmin(value: unknown): string {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isTipTapDoc(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // value is plain text; convert to TipTap doc
    }
    return JSON.stringify(defaultRichText(value));
  }

  if (isTipTapDoc(value)) {
    return JSON.stringify(value);
  }

  return JSON.stringify(defaultRichText());
}

function toObjectId(value: string): ObjectId | null {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function idToString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof ObjectId) return value.toHexString();

  if (typeof value === 'object') {
    const maybeObject = value as { toHexString?: () => string; $oid?: string; toString?: () => string };
    if (typeof maybeObject.toHexString === 'function') {
      return maybeObject.toHexString();
    }
    if (typeof maybeObject.$oid === 'string') {
      return maybeObject.$oid;
    }
    if (typeof maybeObject.toString === 'function') {
      const asString = maybeObject.toString();
      if (asString && asString !== '[object Object]') return asString;
    }
  }

  return '';
}

function asIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  if (typeof value === 'object') {
    const maybeDate = value as { $date?: string | number | Date };
    if (maybeDate.$date) {
      return asIsoString(maybeDate.$date);
    }
  }
  return new Date().toISOString();
}

function seoDefaults(title: string, description: string, image: string): SeoBlock {
  return {
    title,
    description,
    keywords: [],
    image,
  };
}

async function resolveUniqueCategorySlug(baseSlug: string, excludeId?: ObjectId): Promise<string> {
  const db = await getMongoDb();
  const collection = db.collection<CategoryDoc>('categories');
  const rootSlug = baseSlug || 'category';
  let candidate = rootSlug;
  let suffix = 2;

  while (true) {
    const query: Record<string, unknown> = { $or: [{ slug: candidate }, { slugAliases: candidate }] };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await collection.findOne(query, { projection: { _id: 1 } });
    if (!existing) {
      return candidate;
    }

    candidate = `${rootSlug}-${suffix}`;
    suffix += 1;
  }
}

async function resolveUniqueProductSlug(baseSlug: string, excludeId?: ObjectId): Promise<string> {
  const db = await getMongoDb();
  const collection = db.collection<ProductDoc>('products');
  const rootSlug = baseSlug || 'product';
  let candidate = rootSlug;
  let suffix = 2;

  while (true) {
    const query: Record<string, unknown> = { $or: [{ slug: candidate }, { slugAliases: candidate }] };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await collection.findOne(query, { projection: { _id: 1 } });
    if (!existing) {
      return candidate;
    }

    candidate = `${rootSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildSeo(input: SeoInput | undefined, fallbackTitle: string, fallbackDescription: string, fallbackImage: string): SeoBlock {
  return {
    title: input?.title?.trim() || fallbackTitle,
    description: input?.description?.trim() || fallbackDescription,
    keywords: Array.isArray(input?.keywords) ? input!.keywords.map((item) => item.trim()).filter(Boolean) : [],
    image: input?.image?.trim() || fallbackImage,
  };
}

async function ensureIndexes() {
  if (!globalThis.__primeprintsIndexesPromise) {
    globalThis.__primeprintsIndexesPromise = (async () => {
      const db = await getMongoDb();
      await Promise.all([
        db.collection<CategoryDoc>('categories').createIndexes([
          { key: { slug: 1 }, unique: true },
          { key: { slugAliases: 1 } },
          { key: { parentId: 1 } },
        ]),
        db.collection<ProductDoc>('products').createIndexes([
          { key: { slug: 1 }, unique: true },
          { key: { slugAliases: 1 } },
          { key: { categoryIds: 1 } },
          { key: { isFeatured: 1 } },
          { key: { isActive: 1 } },
        ]),
        db.collection<AdminDoc>('admins').createIndexes([{ key: { email: 1 }, unique: true }]),
        db.collection<ReviewDoc>('review').createIndexes([
          { key: { status: 1, createdAt: -1 } },
          { key: { email: 1 } },
        ]),
        db.collection<FaqDoc>('faqs').createIndexes([
          { key: { isActive: 1 } },
          { key: { sortOrder: 1, createdAt: -1 } },
        ]),
      ]);
    })();
  }

  await globalThis.__primeprintsIndexesPromise;
}

function mapCategoryDoc(doc: CategoryDoc): CategoryRecord {
  const image = doc.image ? { ...doc.image, url: doc.image.url || '', alt: doc.image.alt || '' } : { url: '', alt: '' };
  const createdAt = asIsoString(doc.createdAt);
  const updatedAt = asIsoString(doc.updatedAt);
  return {
    id: idToString(doc._id),
    slug: doc.slug,
    slugAliases: Array.isArray(doc.slugAliases) ? normalizeSlugAliases(doc.slugAliases) : [],
    name: doc.name,
    shortDescription: normalizeRichContent(doc.shortDescription),
    description: normalizeRichContent(doc.description),
    image,
    imageUrl: image.url,
    parentId: doc.parentId ? idToString(doc.parentId) : null,
    seo: doc.seo || seoDefaults(doc.name, doc.name, image.url),
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 1,
    createdAt,
    updatedAt,
  };
}

function mapProductDoc(doc: ProductDoc): ProductRecord {
  const images = Array.isArray(doc.images) ? doc.images.map((img) => ({ ...img, url: img.url || '', alt: img.alt || '' })) : [];
  const categoryIds = Array.isArray(doc.categoryIds) ? doc.categoryIds.map((item) => idToString(item)).filter(Boolean) : [];
  const createdAt = asIsoString(doc.createdAt);
  const updatedAt = asIsoString(doc.updatedAt);
  return {
    id: idToString(doc._id),
    slug: doc.slug,
    slugAliases: Array.isArray(doc.slugAliases) ? normalizeSlugAliases(doc.slugAliases) : [],
    name: doc.name,
    shortDescription: normalizeRichContent(doc.shortDescription),
    description: normalizeRichContent(doc.description),
    images,
    categoryIds,
    seo: doc.seo || seoDefaults(doc.name, doc.name, images[0]?.url || ''),
    isFeatured: doc.isFeatured === true,
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 1,
    createdAt,
    updatedAt,
    imageUrl: images.map((img) => img.url || '').filter(Boolean),
    badges: Array.isArray(doc.badges) ? doc.badges : [],
    categoryId: categoryIds,
  };
}

const getCachedCategories = unstable_cache(
  async () => {
    await ensureIndexes();
    const db = await getMongoDb();
    const rows = await db
      .collection<CategoryDoc>('categories')
      .find(
        { isActive: { $ne: false } },
        {
          projection: {
            _id: 1,
            slug: 1,
            slugAliases: 1,
            name: 1,
            shortDescription: 1,
            description: 1,
            image: 1,
            parentId: 1,
            seo: 1,
            isActive: 1,
            sortOrder: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      )
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    return rows;
  },
  ['catalog-categories'],
  { revalidate: CATALOG_TAGGED_DATA_REVALIDATE, tags: ['catalog'] }
);

export async function getCategories(): Promise<CategoryRecord[]> {
  const rows = await getCachedCategories();
  return rows.map(mapCategoryDoc);
}

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  const rows = await getCachedCategories();
  const normalized = id.toLowerCase();
  const row = rows.find(
    (item) => idToString(item._id) === id || item.slug === normalized || item.name.toLowerCase() === normalized || toSlug(item.name) === normalized
  );
  return row ? mapCategoryDoc(row) : null;
}

export async function getProducts(limit = 100): Promise<ProductRecord[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<ProductDoc>('products')
    .find(
      { isActive: { $ne: false } },
      {
        projection: {
          _id: 1,
          slug: 1,
          name: 1,
          shortDescription: 1,
          description: 1,
          images: 1,
          badges: 1,
          categoryIds: 1,
          seo: 1,
          isFeatured: 1,
          isActive: 1,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ sortOrder: 1, name: 1 })
    .limit(limit)
    .toArray();
  return rows.map(mapProductDoc);
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const normalized = id.toLowerCase();
  const objectId = toObjectId(id);

  const row = await db.collection<ProductDoc>('products').findOne(
    objectId
      ? { isActive: { $ne: false }, $or: [{ _id: objectId }, { slug: normalized }, { slugAliases: normalized }, { name: normalized }] }
      : { isActive: { $ne: false }, $or: [{ slug: normalized }, { slugAliases: normalized }, { name: normalized }] },
    {
      projection: {
        _id: 1,
        slug: 1,
        slugAliases: 1,
        name: 1,
        shortDescription: 1,
        description: 1,
        images: 1,
        badges: 1,
        categoryIds: 1,
        seo: 1,
        isFeatured: 1,
        isActive: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  if (row) {
    return mapProductDoc(row);
  }

  const slugFallback = toSlug(id);
  if (slugFallback && slugFallback !== normalized) {
    const fallback = await db.collection<ProductDoc>('products').findOne(
      { isActive: { $ne: false }, $or: [{ slug: slugFallback }, { slugAliases: slugFallback }, { name: slugFallback }] },
      {
        projection: {
          _id: 1,
          slug: 1,
          slugAliases: 1,
          name: 1,
          shortDescription: 1,
          description: 1,
          images: 1,
          badges: 1,
          categoryIds: 1,
          seo: 1,
          isFeatured: 1,
          isActive: 1,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    return fallback ? mapProductDoc(fallback) : null;
  }

  return null;
}

export async function getProductsByCategoryId(categoryId: string, limit = 100): Promise<ProductRecord[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const objectId = toObjectId(categoryId);

  if (!objectId) {
    return [];
  }

  const rows = await db
    .collection<ProductDoc>('products')
    .find(
      { isActive: { $ne: false }, categoryIds: objectId },
      {
        projection: {
          _id: 1,
          slug: 1,
          name: 1,
          shortDescription: 1,
          description: 1,
          images: 1,
          badges: 1,
          categoryIds: 1,
          seo: 1,
          isFeatured: 1,
          isActive: 1,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ sortOrder: 1, name: 1 })
    .limit(limit)
    .toArray();

  return rows.map(mapProductDoc);
}

export async function getProductSummaries(limit = 1000): Promise<Array<Pick<ProductRecord, 'id' | 'slug' | 'name' | 'updatedAt'>>> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<ProductDoc>('products')
    .find(
      { isActive: { $ne: false } },
      {
        projection: {
          _id: 1,
          slug: 1,
          name: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ sortOrder: 1, name: 1 })
    .limit(limit)
    .toArray();

  return rows.map((doc) => ({
    id: idToString(doc._id),
    slug: doc.slug,
    name: doc.name,
    updatedAt: asIsoString(doc.updatedAt),
  }));
}

export async function getProductNavEntries(limit = 1000): Promise<Array<Pick<ProductRecord, 'id' | 'slug' | 'name' | 'shortDescription' | 'badges' | 'isActive' | 'isFeatured' | 'seo' | 'categoryIds'>>> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<ProductDoc>('products')
    .find(
      { isActive: { $ne: false } },
      {
        projection: {
          _id: 1,
          slug: 1,
          name: 1,
          shortDescription: 1,
          badges: 1,
          categoryIds: 1,
          seo: 1,
          isFeatured: 1,
          isActive: 1,
        },
      }
    )
    .sort({ sortOrder: 1, name: 1 })
    .limit(limit)
    .toArray();

  return rows.map((doc) => ({
    id: idToString(doc._id),
    slug: doc.slug,
    name: doc.name,
    shortDescription: normalizeRichContent(doc.shortDescription),
    badges: Array.isArray(doc.badges) ? doc.badges : [],
    categoryIds: Array.isArray(doc.categoryIds) ? doc.categoryIds.map((item) => idToString(item)).filter(Boolean) : [],
    isActive: doc.isActive !== false,
    isFeatured: doc.isFeatured === true,
    seo: doc.seo || seoDefaults(doc.name, doc.name, ''),
  }));
}

export async function getAdminByEmail(email: string): Promise<{ email: string; password_hash: string } | null> {
  await ensureIndexes();
  const db = await getMongoDb();
  const admin = await db.collection<AdminDoc>('admins').findOne({ email: email.toLowerCase() });
  if (!admin) return null;
  return { email: admin.email, password_hash: admin.passwordHash };
}

export async function upsertAdmin(email: string, passwordHash: string): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();
  await db.collection<AdminDoc>('admins').updateOne(
    { email: email.toLowerCase() },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        createdAt: now,
      },
      $set: {
        email: email.toLowerCase(),
        passwordHash,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
}

export async function countAdminItems(): Promise<{ categories: number; products: number; admins: number; reviews: number; faqs: number }> {
  await ensureIndexes();
  const db = await getMongoDb();
  const [categories, products, admins, reviews, faqs] = await Promise.all([
    db.collection<CategoryDoc>('categories').countDocuments(),
    db.collection<ProductDoc>('products').countDocuments(),
    db.collection<AdminDoc>('admins').countDocuments(),
    db.collection<ReviewDoc>('review').countDocuments(),
    db.collection<FaqDoc>('faqs').countDocuments(),
  ]);
  return { categories, products, admins, reviews, faqs };
}

function mapReviewDoc(row: ReviewDoc): ReviewRecord {
  return {
    id: idToString(row._id),
    name: row.name,
    email: row.email,
    rating: row.rating,
    text: row.text,
    status: row.status,
    source: row.source,
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  };
}

const getCachedApprovedReviews = unstable_cache(
  async () => {
    await ensureIndexes();
    const db = await getMongoDb();
    return db
      .collection<ReviewDoc>('review')
      .find(
        { status: 'approved' },
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            rating: 1,
            text: 1,
            status: 1,
            source: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();
  },
  ['approved-reviews'],
  { revalidate: 300, tags: ['reviews'] }
);

export async function getApprovedReviews(limit = 50): Promise<ReviewRecord[]> {
  const rows = await getCachedApprovedReviews();
  return rows.slice(0, limit).map(mapReviewDoc);
}

export async function getAdminReviews(): Promise<AdminReviewRow[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<ReviewDoc>('review')
    .find(
      {},
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          rating: 1,
          text: 1,
          status: 1,
          source: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((row) => ({
    id: idToString(row._id),
    name: row.name,
    email: row.email,
    rating: row.rating,
    text: row.text,
    status: row.status,
    source: row.source,
    created_at: asIsoString(row.createdAt),
  }));
}

export async function createPublicReview(input: {
  name: string;
  email: string;
  rating: number;
  text: string;
}): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();

  await db.collection<ReviewDoc>('review').insertOne({
    _id: new ObjectId(),
    name: input.name,
    email: input.email.toLowerCase(),
    rating: input.rating,
    text: input.text,
    status: 'pending',
    source: 'public',
    createdAt: now,
    updatedAt: now,
  });
}

export async function createAdminReview(input: {
  name: string;
  email: string;
  rating: number;
  text: string;
  status: ReviewStatus;
}): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();

  await db.collection<ReviewDoc>('review').insertOne({
    _id: new ObjectId(),
    name: input.name,
    email: input.email.toLowerCase(),
    rating: input.rating,
    text: input.text,
    status: input.status,
    source: 'admin',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAdminReview(
  id: string,
  input: {
    name: string;
    email: string;
    rating: number;
    text: string;
    status: ReviewStatus;
  }
): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid review id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<ReviewDoc>('review').updateOne(
    { _id: objectId },
    {
      $set: {
        name: input.name,
        email: input.email.toLowerCase(),
        rating: input.rating,
        text: input.text,
        status: input.status,
        updatedAt: new Date(),
      },
    }
  );
}

export async function setAdminReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid review id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<ReviewDoc>('review').updateOne(
    { _id: objectId },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    }
  );
}

export async function deleteAdminReview(id: string): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid review id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<ReviewDoc>('review').deleteOne({ _id: objectId });
}

function mapFaqDoc(doc: FaqDoc): FaqRecord {
  return {
    id: idToString(doc._id),
    question: doc.question,
    answer: doc.answer,
    sortOrder: doc.sortOrder ?? 1,
    isActive: doc.isActive !== false,
    createdAt: asIsoString(doc.createdAt),
    updatedAt: asIsoString(doc.updatedAt),
  };
}

export async function getFaqs(limit = 50): Promise<FaqRecord[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<FaqDoc>('faqs')
    .find(
      { isActive: { $ne: false } },
      {
        projection: {
          _id: 1,
          question: 1,
          answer: 1,
          sortOrder: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();

  return rows.slice(0, limit).map(mapFaqDoc);
}

export async function getAdminFaqs(): Promise<AdminFaqRow[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<FaqDoc>('faqs')
    .find(
      {},
      {
        projection: {
          _id: 1,
          question: 1,
          answer: 1,
          sortOrder: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();

  return rows.map((row) => ({
    id: idToString(row._id),
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder ?? 1,
    isActive: row.isActive !== false,
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  }));
}

export async function createAdminFaq(input: {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();

  await db.collection<FaqDoc>('faqs').insertOne({
    _id: new ObjectId(),
    question: input.question,
    answer: input.answer,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAdminFaq(
  id: string,
  input: {
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
  }
): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid FAQ id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<FaqDoc>('faqs').updateOne(
    { _id: objectId },
    {
      $set: {
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    }
  );
}

export async function deleteAdminFaq(id: string): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid FAQ id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<FaqDoc>('faqs').deleteOne({ _id: objectId });
}

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<CategoryDoc>('categories')
    .find(
      {},
      {
        projection: {
          _id: 1,
          name: 1,
          shortDescription: 1,
          description: 1,
          image: 1,
          parentId: 1,
          seo: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((row) => ({
    id: idToString(row._id),
    name: row.name,
    short_description: serializeRichForAdmin(row.shortDescription),
    description: serializeRichForAdmin(row.description),
    image_url: row.image?.url || '',
    parent_id: row.parentId ? idToString(row.parentId) : null,
    seo_title: row.seo?.title || '',
    seo_description: row.seo?.description || '',
    seo_keywords: JSON.stringify(Array.isArray(row.seo?.keywords) ? row.seo.keywords : []),
    seo_image: row.seo?.image || '',
    created_at: asIsoString(row.createdAt),
  }));
}

export async function createAdminCategory(input: {
  name: string;
  imageUrl: string;
  parentId: string | null;
  shortDescription: string;
  description: string;
  seo?: SeoInput;
}): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();
  const slug = await resolveUniqueCategorySlug(toSlug(input.name));

  await db.collection<CategoryDoc>('categories').insertOne({
    _id: new ObjectId(),
    slug,
    slugAliases: [],
    name: input.name,
    shortDescription: toStoredRich(input.shortDescription),
    description: toStoredRich(input.description),
    image: { url: input.imageUrl, alt: `${input.name} image` },
    parentId: input.parentId ? toObjectId(input.parentId) : null,
    seo: buildSeo(input.seo, `${input.name} Printing`, input.name, input.imageUrl),
    isActive: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAdminCategory(
  id: string,
  input: {
    name: string;
    imageUrl: string;
    parentId: string | null;
    shortDescription: string;
    description: string;
    seo?: SeoInput;
  }
): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid category id');

  await ensureIndexes();
  const db = await getMongoDb();
  const existing = await db.collection<CategoryDoc>('categories').findOne(
    { _id: objectId },
    { projection: { slug: 1, slugAliases: 1 } }
  );
  const slugAliases = normalizeSlugAliases([existing?.slug, ...(existing?.slugAliases || [])]);
  const slug = await resolveUniqueCategorySlug(toSlug(input.name), objectId);
  await db.collection<CategoryDoc>('categories').updateOne(
    { _id: objectId },
    {
      $set: {
        slug,
        slugAliases,
        name: input.name,
        shortDescription: toStoredRich(input.shortDescription),
        description: toStoredRich(input.description),
        image: { url: input.imageUrl, alt: `${input.name} image` },
        parentId: input.parentId ? toObjectId(input.parentId) : null,
        seo: buildSeo(input.seo, `${input.name} Printing`, input.name, input.imageUrl),
        updatedAt: new Date(),
      },
    }
  );
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid category id');

  await ensureIndexes();
  const db = await getMongoDb();

  const linkedProducts = await db.collection<ProductDoc>('products').countDocuments({
    categoryIds: objectId,
  });
  if (linkedProducts > 0) {
    throw new Error('CATEGORY_IN_USE');
  }

  await db.collection<CategoryDoc>('categories').deleteOne({ _id: objectId });
}

export async function resolveCategoryIds(values: string[]): Promise<string[]> {
  if (values.length === 0) return [];

  await ensureIndexes();
  const db = await getMongoDb();
  const asIds = values.map(toObjectId).filter((item): item is ObjectId => Boolean(item));
  const byIds = asIds.length ? await db.collection<CategoryDoc>('categories').find({ _id: { $in: asIds } }).toArray() : [];
  const matchedIdSet = new Set(byIds.map((row) => idToString(row._id)).filter(Boolean));

  const unresolved = values.filter((value) => !matchedIdSet.has(value));
  if (unresolved.length > 0) {
    const byName = await db
      .collection<CategoryDoc>('categories')
      .find({ name: { $in: unresolved.map((item) => item.trim()) } })
      .toArray();
    for (const row of byName) {
      matchedIdSet.add(idToString(row._id));
    }
  }

  return Array.from(matchedIdSet);
}

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  await ensureIndexes();
  const db = await getMongoDb();
  const rows = await db
    .collection<ProductDoc>('products')
    .find(
      {},
      {
        projection: {
          _id: 1,
          name: 1,
          images: 1,
          description: 1,
          shortDescription: 1,
          badges: 1,
          categoryIds: 1,
          seo: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((row) => ({
    id: idToString(row._id),
    name: row.name,
    image_url: JSON.stringify((row.images || []).map((item) => item.url)),
    description: serializeRichForAdmin(row.description),
    short_description: serializeRichForAdmin(row.shortDescription),
    badges: JSON.stringify(row.badges || []),
    category_id: JSON.stringify((row.categoryIds || []).map((item) => idToString(item)).filter(Boolean)),
    seo_title: row.seo?.title || '',
    seo_description: row.seo?.description || '',
    seo_keywords: JSON.stringify(Array.isArray(row.seo?.keywords) ? row.seo.keywords : []),
    seo_image: row.seo?.image || '',
    created_at: asIsoString(row.createdAt),
  }));
}

export async function createAdminProduct(input: {
  name: string;
  imageUrls: string[];
  badges: string[];
  categoryIds: string[];
  description: string;
  shortDescription: string;
  seo?: SeoInput;
}): Promise<void> {
  await ensureIndexes();
  const db = await getMongoDb();
  const now = new Date();
  const imageUrl = input.imageUrls[0] || '';
  const slug = await resolveUniqueProductSlug(toSlug(input.name));

  await db.collection<ProductDoc>('products').insertOne({
    _id: new ObjectId(),
    slug,
    slugAliases: [],
    name: input.name,
    shortDescription: toStoredRich(input.shortDescription),
    description: toStoredRich(input.description),
    images: input.imageUrls.map((url, index) => ({ url, alt: `${input.name} image ${index + 1}` })),
    badges: input.badges,
    categoryIds: input.categoryIds.map((id) => toObjectId(id)).filter((item): item is ObjectId => Boolean(item)),
    seo: buildSeo(input.seo, `${input.name} Printing`, input.name, imageUrl),
    isFeatured: input.badges.some((badge) => badge.toLowerCase() === 'featured'),
    isActive: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAdminProduct(
  id: string,
  input: {
    name: string;
    imageUrls: string[];
    badges: string[];
    categoryIds: string[];
    description: string;
    shortDescription: string;
    seo?: SeoInput;
  }
): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid product id');

  await ensureIndexes();
  const db = await getMongoDb();
  const existing = await db.collection<ProductDoc>('products').findOne(
    { _id: objectId },
    { projection: { slug: 1, slugAliases: 1 } }
  );
  const slugAliases = normalizeSlugAliases([existing?.slug, ...(existing?.slugAliases || [])]);
  const imageUrl = input.imageUrls[0] || '';
  const slug = await resolveUniqueProductSlug(toSlug(input.name), objectId);
  await db.collection<ProductDoc>('products').updateOne(
    { _id: objectId },
    {
      $set: {
        slug,
        slugAliases,
        name: input.name,
        shortDescription: toStoredRich(input.shortDescription),
        description: toStoredRich(input.description),
        images: input.imageUrls.map((url, index) => ({ url, alt: `${input.name} image ${index + 1}` })),
        badges: input.badges,
        categoryIds: input.categoryIds.map((value) => toObjectId(value)).filter((item): item is ObjectId => Boolean(item)),
        seo: buildSeo(input.seo, `${input.name} Printing`, input.name, imageUrl),
        isFeatured: input.badges.some((badge) => badge.toLowerCase() === 'featured'),
        updatedAt: new Date(),
      },
    }
  );
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const objectId = toObjectId(id);
  if (!objectId) throw new Error('Invalid product id');

  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection<ProductDoc>('products').deleteOne({ _id: objectId });
}