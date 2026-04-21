const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d158857.839887706!2d-0.266403!3d51.528308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus';

export default function LocationMapEmbed() {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg bg-stone-200 shadow-lg" aria-label="Interactive map of our London location">
      <iframe
        src={MAP_EMBED_SRC}
        width="100%"
        height="100%"
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="London Location Map"
      />
    </div>
  );
}
