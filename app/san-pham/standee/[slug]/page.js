import { notFound } from 'next/navigation';
import VariantDetail from '@/components/VariantDetail';
import { StandeeArt } from '@/components/illustrations';
import { getProduct } from '@/data/products';
import { getVariantBySlug, getVariantSlugs } from '@/lib/airtable';

const PRODUCT_ID = 'standee';
const product = getProduct(PRODUCT_ID);

export async function generateStaticParams() {
  return getVariantSlugs(PRODUCT_ID);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const variant = await getVariantBySlug(PRODUCT_ID, slug);
  if (!variant) return {};

  const title = `${variant.name} — ${product.title}`;
  const description = variant.description || product.body;

  return {
    title,
    description,
    alternates: { canonical: variant.href },
    openGraph: { url: variant.href, title, description, ...(variant.image ? { images: [{ url: variant.image }] } : {}) },
    twitter: { title, description },
  };
}

export default async function StandeeVariantPage({ params }) {
  const { slug } = await params;
  const variant = await getVariantBySlug(PRODUCT_ID, slug);
  if (!variant) notFound();

  return <VariantDetail variant={variant} product={product} FallbackArt={StandeeArt} />;
}
