const clip = document.getElementById('culigang-video');
if (clip && !matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData) {
  let played = false;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !played) {
        played = true;
        clip.play().catch(() => {});
        observer.disconnect();
      }
    }
  }, { threshold: 0.5 });
  observer.observe(clip);
}
