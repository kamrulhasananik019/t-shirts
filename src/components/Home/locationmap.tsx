import LocationMapEmbed from '@/components/Home/locationmap-embed';

/**
 * Server-rendered copy for crawlers; only the iframe shell is client-side.
 */
export default function LocationMap() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">Our Location</h2>
        <div className="mb-6 text-center">
          <p className="text-gray-600">Visit us in the heart of London for all your printing needs.</p>
          <p className="mt-2 text-gray-600">Address: 123 Printing Street, London, UK</p>
        </div>
        <LocationMapEmbed />
      </div>
    </section>
  );
}
