type ReviewCardProps = {
  name: string;
  rating: number;
  text: string;
  createdAt: string;
};

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#F0D542]">
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ReviewCard({ name, rating, text, createdAt }: ReviewCardProps) {
  return (
    <article className="group relative flex min-h-60 flex-col justify-between rounded-2xl border border-[#F8F8F8]/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F0D542] hover:shadow-xl">
      <div>
        <div className="mb-4 flex gap-1">
          {Array.from({ length: rating }).map((_, starIndex) => (
            <StarIcon key={starIndex} />
          ))}
        </div>

        <p className="text-base font-medium leading-relaxed text-[#0a72b2]">&ldquo;{text}&rdquo;</p>
      </div>

      <div className="mt-6 border-t border-[#F8F8F8] pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F8F8] text-sm font-bold text-[#0a72b2]">
              {getInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0a72b2]">{name}</p>
              <p className="text-xs text-[#0a72b2]">{new Date(createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#F8F8F8] px-2.5 text-xs font-bold text-[#F0D542] ring-1 ring-inset ring-[#F0D542]/20">
            {rating}.0
          </div>
        </div>
      </div>
    </article>
  );
}
